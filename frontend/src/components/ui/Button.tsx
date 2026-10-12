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
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-md border ' +
  'transition-colors duration-fast select-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-on border-primary hover:bg-primary-hover hover:border-primary-hover ' +
    'active:bg-primary-active disabled:hover:bg-primary',
  secondary:
    'bg-surface text-fg border-line hover:bg-surface-interactive hover:border-line-strong ' +
    'active:bg-surface-sunken',
  ghost: 'bg-transparent text-fg-secondary border-transparent hover:bg-surface-interactive hover:text-fg active:bg-surface-sunken',
  danger: 'bg-danger text-fg-inverse border-danger hover:opacity-90 active:opacity-80',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading = false, iconOnly = false, className = '', children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${iconOnly ? (size === 'sm' ? 'w-8 px-0' : 'w-10 px-0') : ''} ${className}`}
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
