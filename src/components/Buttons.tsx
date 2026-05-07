import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight } from './Icons';

export function PrimaryButton({
  children,
  className = '',
  onClick
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button className={`primary-cta ${className}`.trim()} onClick={onClick}>
      <span>{children}</span>
      <ArrowRight size={30} strokeWidth={2.7} />
    </button>
  );
}

type ActionProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  accent?: 'red' | 'blue' | 'muted';
  primary?: boolean;
  arrowVariant?: 'chevron' | 'arrow';
  trailing?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function ActionRow({
  icon,
  title,
  subtitle,
  subtitleClassName = '',
  accent = 'muted',
  primary = false,
  arrowVariant = 'chevron',
  trailing,
  className = '',
  onClick
}: ActionProps) {
  const iconClass = accent === 'red' ? 'icon-red' : accent === 'blue' ? 'icon-blue' : '';
  const classes = ['action-row', !subtitle ? 'action-row-single' : '', primary ? 'card-primary' : '', className].filter(Boolean).join(' ');
  const ArrowIcon = arrowVariant === 'arrow' ? ArrowRight : ChevronRight;

  return (
    <button className={classes} onClick={onClick}>
      <span className={`icon-circle ${iconClass}`}>{icon}</span>
      <span className="action-row-copy min-w-0 flex-1">
        <span className="action-row-title">{title}</span>
        {subtitle && <span className={`action-row-sub ${subtitleClassName}`.trim()}>{subtitle}</span>}
      </span>
      {trailing && <span className="action-row-count">{trailing}</span>}
      <ArrowIcon className="chev" size={34} strokeWidth={2.6} />
    </button>
  );
}
