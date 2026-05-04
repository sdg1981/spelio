import { CSSProperties, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { getScreenTransitionName, motionDurations, motionEasing, type ScreenTransitionName } from '../lib/motion';

type ScreenTransitionPhase = 'enter' | 'exit';

interface ScreenTransitionItem {
  id: number;
  screen: string;
  phase: ScreenTransitionPhase;
  transition: ScreenTransitionName;
  children: ReactNode;
}

export function ScreenTransition({
  screen,
  children
}: {
  screen: string;
  children: ReactNode;
}) {
  const nextId = useRef(1);
  const latestChildren = useRef(children);
  const previousScreen = useRef(screen);
  const cleanupTimer = useRef<number | undefined>(undefined);
  const [items, setItems] = useState<ScreenTransitionItem[]>([
    {
      id: 0,
      screen,
      phase: 'enter',
      transition: 'fade',
      children
    }
  ]);

  useLayoutEffect(() => {
    latestChildren.current = children;

    if (previousScreen.current !== screen) return;

    setItems(previousItems => previousItems.map((item, index) => (
      index === previousItems.length - 1 ? { ...item, children } : item
    )));
  }, [screen, children]);

  useLayoutEffect(() => {
    if (cleanupTimer.current) {
      window.clearTimeout(cleanupTimer.current);
      cleanupTimer.current = undefined;
    }

    const transition = getScreenTransitionName(previousScreen.current, screen);

    setItems(previousItems => {
      const latestItem = previousItems[previousItems.length - 1];

      if (latestItem?.screen === screen) {
        return previousItems.map(item => (
          item.id === latestItem.id ? { ...item, children } : item
        ));
      }

      previousScreen.current = screen;

      return [
        ...previousItems.map(item => ({
          ...item,
          phase: 'exit' as const,
          transition
        })),
        {
          id: nextId.current++,
          screen,
          phase: 'enter' as const,
          transition,
          children: latestChildren.current
        }
      ];
    });

    cleanupTimer.current = window.setTimeout(() => {
      setItems(previousItems => previousItems.slice(-1));
      cleanupTimer.current = undefined;
    }, motionDurations.screenComplete);

    return () => {
      if (cleanupTimer.current) {
        window.clearTimeout(cleanupTimer.current);
        cleanupTimer.current = undefined;
      }
    };
  }, [screen]);

  return (
    <div className="screen-stage">
      {items.map((item, index) => (
        <div
          className="screen-transition"
          data-phase={item.phase}
          data-screen-transition={item.transition}
          data-current={index === items.length - 1 ? 'true' : undefined}
          style={{
            '--screen-enter-duration': `${item.transition === 'practice-to-end' ? motionDurations.screenComplete : motionDurations.screen}ms`,
            '--screen-exit-duration': `${item.transition === 'practice-to-end' ? motionDurations.screenComplete : motionDurations.screen}ms`,
            '--screen-enter-easing': motionEasing.enter,
            '--screen-exit-easing': motionEasing.exit
          } as CSSProperties}
          key={item.id}
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
