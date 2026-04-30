import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight } from './Icons';

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button className="primary-cta" onClick={onClick}>
      <span>{children}</span>
      <ArrowRight size={30} strokeWidth={2.7} />
    </button>
  );
}

type ActionProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: 'red' | 'blue' | 'muted';
  primary?: boolean;
  onClick?: () => void;
};

export function ActionRow({ icon, title, subtitle, accent = 'muted', primary = false, onClick }: ActionProps) {
  const iconClass = accent === 'red' ? 'icon-red' : accent === 'blue' ? 'icon-blue' : '';

  return (
    <button className={`action-row ${primary ? 'card-primary' : ''}`} onClick={onClick}>
      <span className={`icon-circle ${iconClass}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="action-row-title">{title}</span>
        {subtitle && <span className="action-row-sub">{subtitle}</span>}
      </span>
      <ChevronRight className="chev" size={34} strokeWidth={2.6} />
    </button>
  );
}
