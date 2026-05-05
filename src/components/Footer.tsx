type FooterProps = {
  className?: string;
  variant?: 'default' | 'home';
};

export function Footer({ className = '', variant = 'default' }: FooterProps) {
  const year = variant === 'home' ? 2026 : new Date().getFullYear();
  const classes = ['footer-copy', className].filter(Boolean).join(' ');
  const separator = variant === 'home' ? ' · ' : '. ';

  return (
    <p className={classes} aria-label={`Made with love for Wales. Copyright ${year} Spelio`}>
      Made with <span className="footer-heart" aria-hidden="true">♥</span> for Wales{separator}© {year} Spelio
    </p>
  );
}
