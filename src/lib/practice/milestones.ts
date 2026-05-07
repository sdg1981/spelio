export interface Milestone {
  threshold: number;
  title: string;
  message: string;
}

export const LEARNING_MILESTONES: Milestone[] = [
  {
    threshold: 10,
    title: '10 spellings learned',
    message: 'You’ve started building real familiarity with written Welsh.'
  },
  {
    threshold: 25,
    title: '25 spellings learned',
    message: 'Welsh spelling patterns become easier to recognise with regular exposure.'
  },
  {
    threshold: 50,
    title: '50 spellings learned',
    message: 'That is enough practice for written Welsh to start feeling less unfamiliar.'
  },
  {
    threshold: 100,
    title: '100 spellings learned',
    message: 'You’re building a useful foundation in the words and patterns that appear again and again.'
  },
  {
    threshold: 250,
    title: '250 spellings learned',
    message: 'Welsh is beginning to feel more familiar now — not just individual words, but spelling instincts too.'
  }
];

export function checkForMilestone(totalLearnedSpellings: number, shownMilestones: number[]): Milestone | null {
  const maxShownThreshold = shownMilestones.length ? Math.max(...shownMilestones) : 0;
  const eligibleMilestones = LEARNING_MILESTONES.filter(
    milestone => milestone.threshold <= totalLearnedSpellings && milestone.threshold > maxShownThreshold
  );

  return eligibleMilestones[eligibleMilestones.length - 1] ?? null;
}
