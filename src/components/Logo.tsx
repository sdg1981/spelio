import { useState } from 'react';

export function Logo({
  small = false,
  onClick
}: {
  small?: boolean;
  onClick?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const logo = !imageFailed ? (
    <img
      src="/spelio-logo.svg"
      alt="Spelio"
      className={small ? 'logo-svg logo-svg-small' : 'logo-svg logo-svg-home'}
      onError={() => setImageFailed(true)}
    />
  ) : (
    <div className={`logo-text ${small ? 'logo-small' : 'logo-home'}`}>
      Spelio<span className="logo-mark">_</span>
    </div>
  );

  if (!onClick) return logo;

  return (
    <button
      type="button"
      className="border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label="Back to home"
    >
      {logo}
    </button>
  );
}
