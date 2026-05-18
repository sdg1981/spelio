export type CompletedSupportPracticeContext = {
  listId: string;
  returnTo: string;
};

export function getEndScreenProgressSummary(
  progressSummary: string | null | undefined,
  completedSupportPractice: CompletedSupportPracticeContext | null
) {
  return completedSupportPractice ? null : progressSummary ?? null;
}
