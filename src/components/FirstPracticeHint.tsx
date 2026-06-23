import { Repeat } from './Icons';

export function FirstPracticeHint({
  visible,
  primaryText,
  replayText
}: {
  visible: boolean;
  primaryText: string;
  replayText: string;
}) {
  return (
    <div className={`first-practice-hint ${visible ? 'visible' : ''}`.trim()} aria-live="polite">
      {visible && (
        <>
          <span className="first-practice-hint-line">{primaryText}</span>
          <span className="first-practice-hint-line first-practice-hint-replay-line">
            <Repeat className="first-practice-hint-icon" size={14} aria-hidden="true" focusable="false" />
            <span>{replayText}</span>
          </span>
        </>
      )}
    </div>
  );
}
