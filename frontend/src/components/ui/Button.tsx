import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconOnly?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider whitespace-nowrap ' +
  'clip-cut-btn transition-all duration-fast select-none relative ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg ' +
  'disabled:cursor-not-allowed disabled:opacity-40 aria-busy:cursor-progress';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-on border-0 hover:bg-primary-hover active:bg-primary-active ' +
    'shadow-[0_0_12px_rgba(0,255,157,0.35)] hover:shadow-[0_0_18px_rgba(0,255,157,0.6)]',
  secondary:
    'bg-surface-elevated text-fg border border-line hover:border-primary hover:text-primary ' +
    'hover:shadow-[0_0_10px_rgba(0,255,157,0.2)] active:bg-surface-sunken',
  ghost:
    'bg-transparent text-fg-secondary border border-transparent hover:border-line hover:bg-surface-interactive hover:text-primary',
  danger:
    'bg-danger text-fg-inverse border-0 hover:opacity-90 active:opacity-80 ' +
    'shadow-[0_0_12px_rgba(255,0,85,0.35)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-xs md:text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      iconOnly = false,
      className = '',
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        iconOnly ? (size === 'sm' ? 'w-8 px-0' : 'w-9 px-0') : ''
      } ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export const Spinner: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="animate-spin">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
    <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
