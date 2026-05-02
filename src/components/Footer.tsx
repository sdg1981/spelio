type FooterProps = {
  className?: string;
};

export function Footer({ className = '' }: FooterProps) {
  const year = new Date().getFullYear();
  const classes = ['footer-copy', className].filter(Boolean).join(' ');

  return (
    <p className={classes} aria-label={`Made with love for Wales. Copyright ${year} Spelio`}>
      Made with <span className="footer-heart" aria-hidden="true">♥</span> for Wales. © {year} Spelio
    </p>
  );
}
