import { triggerIncorrectHaptic } from '../src/lib/haptics';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value
  });
}

try {
  {
    const calls: number[] = [];
    setNavigator({ vibrate: (duration: number) => calls.push(duration) });

    triggerIncorrectHaptic(true);

    assertEqual(calls.length, 1, 'Incorrect haptic should call vibration when supported and sound effects are on.');
    assertEqual(calls[0], 10, 'Incorrect haptic should use a tiny 10ms duration.');
  }

  {
    const calls: number[] = [];
    setNavigator({ vibrate: (duration: number) => calls.push(duration) });

    triggerIncorrectHaptic(false);

    assertEqual(calls.length, 0, 'Incorrect haptic should not vibrate when sound effects are off.');
  }

  {
    setNavigator({});

    triggerIncorrectHaptic(true);
  }

  {
    setNavigator(undefined);

    triggerIncorrectHaptic(true);
  }

  {
    setNavigator({
      vibrate: () => {
        throw new Error('Vibration rejected');
      }
    });

    triggerIncorrectHaptic(true);
  }
} finally {
  if (originalNavigator) {
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
  } else {
    delete (globalThis as { navigator?: Navigator }).navigator;
  }
}

console.log('haptics tests passed');
