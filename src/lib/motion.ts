export const motionDurations = {
  micro: 150,
  screen: 200,
  screenComplete: 220,
  modal: 180
} as const;

export const motionEasing = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  standard: 'ease-in-out'
} as const;

export type ScreenTransitionName =
  | 'home-to-practice'
  | 'practice-to-end'
  | 'fade';

export function getScreenTransitionName(from: string, to: string): ScreenTransitionName {
  if (from === 'home' && to === 'practice') return 'home-to-practice';
  if (from === 'practice' && to === 'end') return 'practice-to-end';
  return 'fade';
}
