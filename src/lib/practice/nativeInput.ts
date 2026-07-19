export type NativeInputCommit = (value: string) => void;

type ScheduledTask = ReturnType<typeof setTimeout>;

export type NativeInputScheduler = {
  schedule: (callback: () => void) => ScheduledTask;
  cancel: (task: ScheduledTask) => void;
};

const browserScheduler: NativeInputScheduler = {
  schedule: callback => setTimeout(callback, 0),
  cancel: task => clearTimeout(task)
};

/**
 * Keeps the native hidden input to one printable-character path.
 *
 * Browsers normally emit a final input event after compositionend. That input
 * event is authoritative. The delayed composition fallback covers engines that
 * omit it, and is cancelled when the normal input event arrives.
 */
export function createNativeInputCoordinator(scheduler: NativeInputScheduler = browserScheduler) {
  let composing = false;
  let compositionFallback: ScheduledTask | null = null;

  function cancelCompositionFallback() {
    if (compositionFallback === null) return;
    scheduler.cancel(compositionFallback);
    compositionFallback = null;
  }

  function startComposition() {
    cancelCompositionFallback();
    composing = true;
  }

  function handleInput(value: string, eventIsComposing: boolean, commit: NativeInputCommit) {
    if (composing || eventIsComposing) return false;

    cancelCompositionFallback();
    if (!value) return false;
    commit(value);
    return true;
  }

  function endComposition({
    readValue,
    clearValue,
    commit
  }: {
    readValue: () => string;
    clearValue: () => void;
    commit: NativeInputCommit;
  }) {
    composing = false;
    cancelCompositionFallback();
    compositionFallback = scheduler.schedule(() => {
      compositionFallback = null;
      const value = readValue();
      if (!value) return;
      commit(value);
      clearValue();
    });
  }

  function reset() {
    cancelCompositionFallback();
    composing = false;
  }

  return {
    startComposition,
    handleInput,
    endComposition,
    reset
  };
}
