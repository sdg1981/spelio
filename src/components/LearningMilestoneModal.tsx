import type { Milestone } from '../lib/practice/milestones';

export function LearningMilestoneModal({
  milestone,
  onDismiss
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  return (
    <div className="learning-milestone-overlay" role="presentation">
      <section
        className="learning-milestone-modal"
        role="dialog"
        aria-modal="false"
        aria-labelledby="learning-milestone-title"
        aria-describedby="learning-milestone-message"
      >
        <h2 id="learning-milestone-title">{milestone.title}</h2>
        <p id="learning-milestone-message">{milestone.message}</p>
        <button type="button" onClick={onDismiss}>Continue</button>
      </section>
    </div>
  );
}
