import { useState } from 'react';

export function Logo({
  small = false,
  onClick,
  animateCursor = false,
  backHomeLabel = 'Back to home'
}: {
  small?: boolean;
  onClick?: () => void;
  animateCursor?: boolean;
  backHomeLabel?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const logo = !small ? (
    <SpelioInlineLogo animateCursor={animateCursor} />
  ) : !imageFailed ? (
    <img
      src="/spelio-logo.svg"
      alt="Spelio"
      className="logo-svg logo-svg-small"
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
      aria-label={backHomeLabel}
    >
      {logo}
    </button>
  );
}

function SpelioInlineLogo({ animateCursor }: { animateCursor: boolean }) {
  return (
    <svg
      className={`logo-svg logo-svg-home ${animateCursor ? 'logo-cursor-intro' : ''}`}
      role="img"
      aria-label="Spelio"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 540.01 159.56"
    >
      <path className="logo-letter-fill" d="M76.68,122.64c-10.92,5.67-22.03,6.52-34.25,5.8-15.66-.93-30.97-6.77-42.43-18.23l14.06-17.03,4.82,4.55c11.99,9.96,34.56,14.78,47.11,5.96,6.72-4.72,7.93-14.64,1.84-20.31-2.84-2.65-6.29-4.4-10.02-5.43l-22.2-6.11c-18.92-5.21-32.43-15.74-31.42-36.63.55-11.37,6.62-21.58,16.26-27.59C36.07-2.12,56.91-1.8,73.87,4.52c6.39,2.65,11.85,5.95,17.13,10.71l-12.66,16.55c-5.58-4.49-11.2-8.07-17.95-9.85-8.5-2.24-17.52-2.27-25.33,1.63-5.35,2.67-8.16,7.74-7.59,13.69.82,8.5,9.97,11.73,18.12,13.91l15.6,4.17c18.43,4.93,33.19,13.59,34.1,34.3.61,13.88-6.14,26.54-18.61,33.01Z" />
      <path className="logo-letter-fill" d="M129.65,114.98l-.03,44.48-10.76.06c-3.65.02-7.24.17-10.91-.33V39.93s21.58-.03,21.58-.03l.13,12.26c4.27-5.36,9.41-9.91,16.11-12.18,13.79-4.68,29.07-1.88,40.23,7.53,20.56,17.33,21.29,53.99.37,71.67-9.29,7.47-21.02,10.61-32.92,9.18-9.66-1.16-17.62-5.86-23.81-13.38ZM170.46,103.93c12.01-9.46,11.81-29.9,1.38-39.8-10.6-10.07-27.82-8.87-36.77,2.67s-7.39,28.91,4.26,37.52c9.12,6.74,22.01,6.8,31.13-.39Z" />
      <path className="logo-letter-fill" d="M283.62,100.37l6.43,5.77,7.29,6.5c-6.75,7.48-14.84,12.26-24.45,14.5-18.75,4.37-38.77.06-51.33-15.03-7.01-8.42-9.64-18.83-9.55-29.65.21-24.68,19.44-44.19,44.18-44.64,11.38-.21,22.36,2.94,31.05,10.55,11.77,10.32,15.7,25.96,14.46,41.78h-67.39c.92,8.29,6.39,15,14.17,18.16,11.77,4.79,25.57,2.22,35.14-7.95ZM280.13,74.53c-.5-6.54-3.85-11.56-8.85-15.05-5.79-3.93-12.83-4.83-19.7-3.21-9.02,2.13-15.89,9.16-17.22,18.32l45.77-.06Z" />
      <path className="logo-letter-fill" d="M454.08,127.09c-22.34,5.64-46.72-3.71-55.77-25.13-3.08-7.29-4.03-14.66-3.41-22.53,1.84-23.66,20.29-40.81,44.11-41.61,25.98-.88,46.4,16.63,47.93,42.57l-.08,7.31c-1.32,18.96-14.08,34.67-32.79,39.39ZM438.57,109.08c11.53,1.14,21.9-5.65,25.43-16.59,2.83-8.77,1.47-18.68-4.26-26-5.97-7.65-15.67-10.79-25.18-8.32-8.28,2.15-15.02,9.05-17.16,18.01-3.82,16.01,4.82,31.29,21.17,32.9Z" />
      <polygon className="logo-letter-fill" points="339.87 126.45 318.08 126.69 318.09 1.11 339.86 1.11 339.87 126.45" />
      <polygon className="logo-letter-fill" points="379.84 126.62 357.81 126.74 357.82 39.91 379.81 39.88 379.84 126.62" />
      <path className="logo-letter-fill" d="M377.13,24.03c-4.46,3.31-9.89,3.74-14.65,1.21-4.11-2.19-7.22-6.67-6.98-12.04.26-5.91,4.58-10.61,9.86-12.1,5.83-1.64,11.9.83,15.11,6.15,3.3,5.46,1.92,12.87-3.34,16.78Z" />
      <rect className="logo-cursor-mark" x="490.74" y="104.7" width="49.27" height="17.64" rx="1.42" ry="1.42" />
    </svg>
  );
}
