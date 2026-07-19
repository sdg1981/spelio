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

export type NativeBufferUpdateKind = 'append' | 'deletion' | 'replacement' | 'duplicate' | 'no-op';

export type NativeInputTrace = {
  action:
    | 'composition-started'
    | 'fallback-scheduled'
    | 'fallback-cancelled'
    | 'fallback-fired'
    | 'fallback-stale'
    | 'input-committed'
    | 'input-ignored-duplicate'
    | 'input-ignored-noninsert'
    | 'input-buffer-rebased'
    | 'input-ignored-empty'
    | 'coordinator-reset'
    | 'value-cleared';
  cycleId: number | null;
  inputType?: string;
  value?: string;
  context?: NativeInputContext;
  previousBufferLength?: number;
  currentBufferLength?: number;
  acknowledgedBufferLength?: number;
  derivedValue?: string;
  updateKind?: NativeBufferUpdateKind;
  logicalCharacterEmitted?: boolean;
};

export type NativeInputHandlingResult = {
  handled: boolean;
  committed: boolean;
  duplicate: boolean;
  value: string;
  cycleId: number | null;
  clearValue: boolean;
  updateKind: NativeBufferUpdateKind;
  previousBufferLength: number;
  currentBufferLength: number;
  acknowledgedBufferLength: number;
};

type CompositionCycle = {
  id: number;
  context: NativeInputContext;
  finalPayload: string;
  state: 'composing' | 'fallback-pending' | 'committed-native' | 'committed-fallback' | 'acknowledged';
};

type BufferDelta = {
  kind: NativeBufferUpdateKind;
  value: string;
};

const browserScheduler: NativeInputScheduler = {
  schedule: callback => setTimeout(callback, 0),
  cancel: task => clearTimeout(task)
};

function sameContext(left: NativeInputContext, right: NativeInputContext) {
  return left.wordId === right.wordId && left.inputPosition === right.inputPosition;
}

function normaliseBuffer(value: string) {
  return value.normalize('NFC');
}

function characterCount(value: string) {
  return Array.from(value).length;
}

function isInsertionInputType(inputType: string) {
  return !inputType || inputType.startsWith('insert');
}

function deriveBufferDelta(previous: string, current: string): BufferDelta {
  if (current === previous) {
    return { kind: current ? 'duplicate' : 'no-op', value: '' };
  }
  if (current.startsWith(previous)) {
    return { kind: 'append', value: current.slice(previous.length) };
  }
  if (previous.startsWith(current)) {
    return { kind: 'deletion', value: '' };
  }
  return { kind: 'replacement', value: '' };
}

function emitLogicalCharacters(value: string, commit: NativeInputCommit) {
  for (const character of Array.from(normaliseBuffer(value))) commit(character);
}

/**
 * Coordinates the hidden native input as a transport buffer.
 *
 * Some keyboards keep one composition alive across many ordinary key presses
 * and expose the complete cumulative buffer on each input event. Every native
 * input is therefore authoritative, including composing input. Only the delta
 * appended after the acknowledged buffer is emitted to validation.
 */
export function createNativeInputCoordinator(
  scheduler: NativeInputScheduler = browserScheduler,
  initialTrace?: (event: NativeInputTrace) => void
) {
  let composing = false;
  let nextCycleId = 1;
  let compositionFallback: ScheduledTask | null = null;
  let currentCycle: CompositionCycle | null = null;
  let acknowledgedBuffer = '';
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
      context: currentCycle?.context,
      acknowledgedBufferLength: characterCount(acknowledgedBuffer)
    });
  }

  function startComposition(context: NativeInputContext, initialValue = '') {
    cancelCompositionFallback();
    composing = true;
    const normalizedInitialValue = normaliseBuffer(initialValue);
    // A keyboard may continue exposing its old transport buffer after blur or
    // across a Spelio word transition. Treat what already exists as consumed.
    acknowledgedBuffer = normalizedInitialValue;
    currentCycle = {
      id: nextCycleId,
      context,
      finalPayload: '',
      state: 'composing'
    };
    nextCycleId += 1;
    emit({
      action: 'composition-started',
      cycleId: currentCycle.id,
      context,
      previousBufferLength: characterCount(acknowledgedBuffer),
      currentBufferLength: characterCount(normalizedInitialValue),
      acknowledgedBufferLength: characterCount(acknowledgedBuffer),
      updateKind: 'no-op',
      logicalCharacterEmitted: false
    });
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
    const previousBuffer = acknowledgedBuffer;
    const cycleId = currentCycle?.id ?? null;
    const persistentComposition = composing || eventIsComposing || inputType === 'insertCompositionText';
    const normalizedValue = normaliseBuffer(value);
    const normalizedData = data === null ? null : normaliseBuffer(data);
    const finalizedValueExtendsAcknowledged = Boolean(
      acknowledgedBuffer && normalizedValue.startsWith(acknowledgedBuffer)
    );
    const finalizedTransportRebased = Boolean(
      !persistentComposition &&
      normalizedData !== null &&
      acknowledgedBuffer &&
      !finalizedValueExtendsAcknowledged
    );
    const comparisonBuffer = finalizedTransportRebased ? '' : previousBuffer;
    const currentBuffer = persistentComposition
      ? normalizedValue || normalizedData || ''
      : finalizedValueExtendsAcknowledged
        ? normalizedValue
        : normalizedData ?? normalizedValue;
    const previousBufferLength = characterCount(previousBuffer);
    const currentBufferLength = characterCount(currentBuffer);

    if (!isInsertionInputType(inputType)) {
      cancelCompositionFallback();
      acknowledgedBuffer = currentBuffer;
      emit({
        action: 'input-ignored-noninsert',
        cycleId,
        inputType,
        context,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: currentBufferLength,
        updateKind: currentBufferLength < previousBufferLength ? 'deletion' : 'replacement',
        logicalCharacterEmitted: false
      });
      return {
        handled: true,
        committed: false,
        duplicate: false,
        value: '',
        cycleId,
        clearValue: !persistentComposition,
        updateKind: currentBufferLength < previousBufferLength ? 'deletion' : 'replacement',
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: currentBufferLength
      };
    }

    const matchesCommittedFinal = Boolean(
      currentCycle &&
      (currentCycle.state === 'committed-fallback' || currentCycle.state === 'committed-native') &&
      currentCycle.finalPayload &&
      (
        normaliseBuffer(data ?? '') === currentCycle.finalPayload ||
        currentBuffer.endsWith(currentCycle.finalPayload)
      )
    );
    if (matchesCommittedFinal && currentCycle) {
      emit({
        action: 'input-ignored-duplicate',
        cycleId: currentCycle.id,
        inputType,
        context,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: previousBufferLength,
        derivedValue: currentCycle.finalPayload,
        updateKind: 'duplicate',
        logicalCharacterEmitted: false
      });
      return {
        handled: true,
        committed: false,
        duplicate: true,
        value: currentCycle.finalPayload,
        cycleId: currentCycle.id,
        clearValue: !persistentComposition,
        updateKind: 'duplicate',
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: previousBufferLength
      };
    }

    const delta = deriveBufferDelta(comparisonBuffer, currentBuffer);
    if (delta.kind === 'deletion' || delta.kind === 'replacement') {
      cancelCompositionFallback();
      acknowledgedBuffer = currentBuffer;
      emit({
        action: 'input-buffer-rebased',
        cycleId,
        inputType,
        context,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: currentBufferLength,
        updateKind: delta.kind,
        logicalCharacterEmitted: false
      });
      return {
        handled: true,
        committed: false,
        duplicate: false,
        value: '',
        cycleId,
        clearValue: !persistentComposition,
        updateKind: delta.kind,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: currentBufferLength
      };
    }

    if (!delta.value) {
      const duplicate = delta.kind === 'duplicate';
      emit({
        action: duplicate ? 'input-ignored-duplicate' : 'input-ignored-empty',
        cycleId,
        inputType,
        context,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: previousBufferLength,
        updateKind: delta.kind,
        logicalCharacterEmitted: false
      });
      return {
        handled: true,
        committed: false,
        duplicate,
        value: '',
        cycleId,
        clearValue: !persistentComposition,
        updateKind: delta.kind,
        previousBufferLength,
        currentBufferLength,
        acknowledgedBufferLength: previousBufferLength
      };
    }

    cancelCompositionFallback();
    emitLogicalCharacters(delta.value, commit);
    acknowledgedBuffer = currentBuffer;
    if (currentCycle && !persistentComposition) {
      currentCycle.finalPayload = delta.value;
      currentCycle.state = 'committed-native';
    }
    emit({
      action: 'input-committed',
      cycleId,
      inputType,
      value: delta.value,
      context,
      previousBufferLength,
      currentBufferLength,
      acknowledgedBufferLength: currentBufferLength,
      derivedValue: delta.value,
      updateKind: 'append',
      logicalCharacterEmitted: true
    });
    return {
      handled: true,
      committed: true,
      duplicate: false,
      value: delta.value,
      cycleId,
      clearValue: !persistentComposition,
      updateKind: 'append',
      previousBufferLength,
      currentBufferLength,
      acknowledgedBufferLength: currentBufferLength
    };
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
      finalPayload: '',
      state: 'composing' as const
    };
    if (!currentCycle) nextCycleId += 1;
    currentCycle = cycle;
    cycle.context = context;

    const finalBuffer = normaliseBuffer(readValue() || data);
    const previousBuffer = acknowledgedBuffer;
    const delta = deriveBufferDelta(previousBuffer, finalBuffer);
    if (!delta.value || delta.kind !== 'append') {
      acknowledgedBuffer = finalBuffer;
      cycle.finalPayload = '';
      cycle.state = 'acknowledged';
      emit({
        action: delta.kind === 'duplicate' ? 'input-ignored-duplicate' : 'input-buffer-rebased',
        cycleId: cycle.id,
        value: '',
        context,
        previousBufferLength: characterCount(previousBuffer),
        currentBufferLength: characterCount(finalBuffer),
        acknowledgedBufferLength: characterCount(acknowledgedBuffer),
        updateKind: delta.kind,
        logicalCharacterEmitted: false
      });
      return cycle.id;
    }

    cycle.finalPayload = delta.value;
    cycle.state = 'fallback-pending';
    const fallbackPreviousBuffer = acknowledgedBuffer;
    compositionFallback = scheduler.schedule(() => {
      compositionFallback = null;
      if (currentCycle?.id !== cycle.id || !sameContext(context, getContext())) {
        emit({
          action: 'fallback-stale',
          cycleId: cycle.id,
          value: cycle.finalPayload,
          context,
          previousBufferLength: characterCount(fallbackPreviousBuffer),
          currentBufferLength: characterCount(finalBuffer),
          acknowledgedBufferLength: characterCount(acknowledgedBuffer),
          derivedValue: cycle.finalPayload,
          updateKind: 'append',
          logicalCharacterEmitted: false
        });
        return;
      }

      emitLogicalCharacters(cycle.finalPayload, commit);
      acknowledgedBuffer = '';
      clearValue();
      cycle.state = 'committed-fallback';
      emit({
        action: 'fallback-fired',
        cycleId: cycle.id,
        value: cycle.finalPayload,
        context,
        previousBufferLength: characterCount(fallbackPreviousBuffer),
        currentBufferLength: characterCount(finalBuffer),
        acknowledgedBufferLength: 0,
        derivedValue: cycle.finalPayload,
        updateKind: 'append',
        logicalCharacterEmitted: true
      });
    });
    emit({
      action: 'fallback-scheduled',
      cycleId: cycle.id,
      value: cycle.finalPayload,
      context,
      previousBufferLength: characterCount(fallbackPreviousBuffer),
      currentBufferLength: characterCount(finalBuffer),
      acknowledgedBufferLength: characterCount(fallbackPreviousBuffer),
      derivedValue: cycle.finalPayload,
      updateKind: 'append',
      logicalCharacterEmitted: false
    });
    return cycle.id;
  }

  function acknowledgeValueCleared() {
    acknowledgedBuffer = '';
    emit({
      action: 'value-cleared',
      cycleId: currentCycle?.id ?? null,
      acknowledgedBufferLength: 0,
      updateKind: 'no-op',
      logicalCharacterEmitted: false
    });
  }

  function reset(preservedValue = '') {
    cancelCompositionFallback();
    composing = false;
    currentCycle = null;
    acknowledgedBuffer = normaliseBuffer(preservedValue);
    emit({
      action: 'coordinator-reset',
      cycleId: null,
      currentBufferLength: characterCount(acknowledgedBuffer),
      acknowledgedBufferLength: characterCount(acknowledgedBuffer),
      updateKind: 'no-op',
      logicalCharacterEmitted: false
    });
  }

  return {
    startComposition,
    handleInput,
    endComposition,
    acknowledgeValueCleared,
    reset,
    setTraceListener
  };
}
