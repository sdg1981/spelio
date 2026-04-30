import { useState } from 'react';

export function Logo({ small = false }: { small?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <img
        src="/spelio-logo.svg"
        alt="Spelio"
        className={small ? 'logo-svg logo-svg-small' : 'logo-svg logo-svg-home'}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`logo-text ${small ? 'logo-small' : 'logo-home'}`}>
      Spelio<span className="logo-mark">_</span>
    </div>
  );
}
