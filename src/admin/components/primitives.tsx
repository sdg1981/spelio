import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-[0_18px_42px_rgba(7,21,34,0.035)] ${className}`}>{children}</section>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function AdminSpinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function AdminButton({
  children,
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'border-red-600 bg-red-600 text-white shadow-[0_14px_28px_rgba(214,0,0,.16)] hover:bg-red-700',
    secondary: 'border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100'
  };

  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    />
  );
}

export function AdminTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    />
  );
}

export function AdminSelect({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
      {helper && <span className="text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}
