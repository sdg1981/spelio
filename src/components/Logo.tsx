export function Logo({ small=false }: { small?: boolean }) {
  return <div className={`logo-text ${small ? 'logo-small' : 'logo-home'}`}>Spelio<span className="logo-mark">_</span></div>;
}
