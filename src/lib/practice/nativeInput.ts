export type NativeInputCommit = (value: string) => void;

type ScheduledTask = ReturnType<typeof setTimeout>;

export type NativeInputScheduler = {
  schedule: (callback: () => void) => ScheduledTask;
  cancel: (task: ScheduledTask) => void;
};

export type NativeInputContext = {
  wordId: string;
  inputPosition: number;
};

export type NativeInputTrace = {
  action:
    | 'composition-started'
    | 'fallback-scheduled'
    | 'fallback-cancelled'
    | 'fallback-fired'
    | 'fallback-stale'
    | 'input-committed'
    | 'input-ignored-composing'
    | 'input-ignored-duplicate'
    | 'input-ignored-noninsert'
    | 'input-ignored-empty'
    | 'coordinator-reset';
  cycleId: number | null;
  inputType?: string;
  value?: string;
  context?: NativeInputContext;
};

export type NativeInputHandlingResult = {
  handled: boolean;
  committed: boolean;
  duplicate: boolean;
  value: string;
  cycleId: number | null;
};

type CompositionCycle = {
  id: number;
  context: NativeInputContext;
  payload: string;
  state: 'composing' | 'fallback-pending' | 'committed-native' | 'committed-fallback';
};

const browserScheduler: NativeInputScheduler = {
  schedule: callback => setTimeout(callback, 0),
  cancel: task => clearTimeout(task)
};

function sameContext(left: NativeInputContext, right: NativeInputContext) {
  return left.wordId === right.wordId && left.inputPosition === right.inputPosition;
}

function normalisePayload(value: string) {
  return value.normalize('NFC');
}

function isInsertionInputType(inputType: string) {
  return !inputType || inputType.startsWith('insert');
}

function insertedPayload(value: string, data: string | null, inputType: string, acknowledgedValue: string) {
  if (!isInsertionInputType(inputType)) return '';
  // `data` describes the new logical insertion. Samsung may leave an older
  // acknowledged prefix in the hidden input's complete value.
  if (data !== null) return normalisePayload(data);
  const normalizedValue = normalisePayload(value);
  return acknowledgedValue && normalizedValue.startsWith(acknowledgedValue)
    ? normalizedValue.slice(acknowledgedValue.length)
    : normalizedValue;
}

/**
 * Coordinates native hidden-input events into one logical commit per keyboard
 * action. A composition cycle remains identifiable after its fallback fires so
 * a matching late input is consumed instead of reaching the next answer slot.
 */
export function createNativeInputCoordinator(
  scheduler: NativeInputScheduler = browserScheduler,
  initialTrace?: (event: NativeInputTrace) => void
) {
  let composing = false;
  let nextCycleId = 1;
  let compositionFallback: ScheduledTask | null = null;
  let currentCycle: CompositionCycle | null = null;
  let acknowledgedValue = '';
  let trace = initialTrace;

  function emit(event: NativeInputTrace) {
    trace?.(event);
  }

  function setTraceListener(listener?: (event: NativeInputTrace) => void) {
    trace = listener;
  }

  function cancelCompositionFallback() {
    if (compositionFallback === null) return;
    scheduler.cancel(compositionFallback);
    compositionFallback = null;
    emit({
      action: 'fallback-cancelled',
      cycleId: currentCycle?.id ?? null,
      context: currentCycle?.context
    });
  }

  function startComposition(context: NativeInputContext) {
    cancelCompositionFallback();
    composing = true;
    currentCycle = {
      id: nextCycleId,
      context,
      payload: '',
      state: 'composing'
    };
    nextCycleId += 1;
    emit({ action: 'composition-started', cycleId: currentCycle.id, context });
    return currentCycle.id;
  }

  function handleInput({
    value,
    data,
    inputType,
    eventIsComposing,
    context,
    commit
  }: {
    value: string;
    data: string | null;
    inputType: string;
    eventIsComposing: boolean;
    context: NativeInputContext;
    commit: NativeInputCommit;
  }): NativeInputHandlingResult {
    const payload = insertedPayload(value, data, inputType, acknowledgedValue);
    const cycleId = currentCycle?.id ?? null;

    if (composing || eventIsComposing) {
      emit({ action: 'input-ignored-composing', cycleId, inputType, value: payload, context });
      return { handled: false, committed: false, duplicate: false, value: payload, cycleId };
    }

    if (!isInsertionInputType(inputType)) {
      cancelCompositionFallback();
      emit({ action: 'input-ignored-noninsert', cycleId, inputType, context });
      return { handled: true, committed: false, duplicate: false, value: '', cycleId };
    }

    if (
      !payload &&
      data === null &&
      currentCycle &&
      (currentCycle.state === 'committed-fallback' || currentCycle.state === 'committed-native') &&
      normalisePayload(value) === acknowledgedValue
    ) {
      emit({
        action: 'input-ignored-duplicate',
        cycleId: currentCycle.id,
        inputType,
        value: currentCycle.payload,
        context
      });
      return {
        handled: true,
        committed: false,
        duplicate: true,
        value: currentCycle.payload,
        cycleId: currentCycle.id
      };
    }

    if (!payload) {
      emit({ action: 'input-ignored-empty', cycleId, inputType, context });
      return { handled: false, committed: false, duplicate: false, value: '', cycleId };
    }

    const matchesCommittedCycle = Boolean(
      currentCycle &&
      (currentCycle.state === 'committed-fallback' || currentCycle.state === 'committed-native') &&
      (
        currentCycle.payload === payload ||
        (data === null && normalisePayload(value).endsWith(currentCycle.payload))
      )
    );
    if (matchesCommittedCycle && currentCycle) {
      emit({
        action: 'input-ignored-duplicate',
        cycleId: currentCycle.id,
        inputType,
        value: payload,
        context
      });
      return {
        handled: true,
        committed: false,
        duplicate: true,
        value: payload,
        cycleId: currentCycle.id
      };
    }

    cancelCompositionFallback();
    commit(payload);
    acknowledgedValue = normalisePayload(value);
    if (currentCycle) {
      currentCycle.payload = payload;
      currentCycle.state = 'committed-native';
    }
    emit({ action: 'input-committed', cycleId, inputType, value: payload, context });
    return { handled: true, committed: true, duplicate: false, value: payload, cycleId };
  }

  function endComposition({
    data,
    readValue,
    clearValue,
    context,
    getContext,
    commit
  }: {
    data: string;
    readValue: () => string;
    clearValue: () => void;
    context: NativeInputContext;
    getContext: () => NativeInputContext;
    commit: NativeInputCommit;
  }) {
    composing = false;
    cancelCompositionFallback();

    const cycle = currentCycle ?? {
      id: nextCycleId,
      context,
      payload: '',
      state: 'composing' as const
    };
    if (!currentCycle) nextCycleId += 1;
    currentCycle = cycle;
    cycle.context = context;
    cycle.payload = normalisePayload(data || readValue());
    cycle.state = 'fallback-pending';

    compositionFallback = scheduler.schedule(() => {
      compositionFallback = null;
      if (currentCycle?.id !== cycle.id || !sameContext(context, getContext())) {
        emit({
          action: 'fallback-stale',
          cycleId: cycle.id,
          value: cycle.payload,
          context
        });
        return;
      }

      const payload = cycle.payload || normalisePayload(readValue());
      if (!payload) {
        emit({ action: 'input-ignored-empty', cycleId: cycle.id, context });
        return;
      }

      const fullValue = readValue();
      commit(payload);
      acknowledgedValue = normalisePayload(fullValue);
      clearValue();
      cycle.payload = payload;
      cycle.state = 'committed-fallback';
      emit({ action: 'fallback-fired', cycleId: cycle.id, value: payload, context });
    });
    emit({
      action: 'fallback-scheduled',
      cycleId: cycle.id,
      value: cycle.payload,
      context
    });
    return cycle.id;
  }

  function reset() {
    cancelCompositionFallback();
    composing = false;
    currentCycle = null;
    acknowledgedValue = '';
    emit({ action: 'coordinator-reset', cycleId: null });
  }

  return {
    startComposition,
    handleInput,
    endComposition,
    reset,
    setTraceListener
  };
}
