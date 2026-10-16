import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/**
 * Cut-corner cyber skeleton placeholder.
 */
export const PageSkeleton: React.FC<{ label?: string }> = ({ label = 'Acquiring telemetry stream' }) => (
  <div role="status" aria-live="polite" className="space-y-6">
    <span className="sr-only">{label}</span>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-80 max-w-full" />
    </div>
    <div className="cyber-cut-frame">
      <div className="cyber-cut-inner grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-5 space-y-3 bg-surface">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </div>
    <div className="cyber-cut-frame">
      <div className="cyber-cut-inner p-5 space-y-4 bg-surface">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  error: Error | null;
  onRetry?: () => void;
}> = ({ title = 'SYSTEM_ERROR // VIEW_UNAVAILABLE', error, onRetry }) => (
  <div
    role="alert"
    className="cyber-cut-frame max-w-xl shadow-[0_0_20px_rgba(255,0,85,0.25)]"
    style={{ background: 'var(--color-error)' }}
  >
    <div className="cyber-cut-inner p-6 md:p-8 bg-surface">
      <div className="flex items-start gap-3.5">
        <span className="text-danger mt-0.5 shrink-0">
          <Icon name="alert" size={20} />
        </span>
        <div className="space-y-2 min-w-0">
          <h2 className="text-base font-display font-bold uppercase tracking-wider text-fg">{title}</h2>
          <p className="text-xs md:text-sm text-fg-secondary font-mono leading-normal">
            {error?.message ?? 'An unexpected system anomaly occurred.'}
          </p>
          {onRetry && (
            <div className="pt-2">
              <Button size="sm" onClick={onRetry}>
                <Icon name="refresh" size={14} /> Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, children, action }) => (
  <div className="py-12 px-4 text-center font-mono">
    <p className="text-xs md:text-sm font-bold text-fg uppercase tracking-wider">
      {"// "}{title}
    </p>
    {children && <p className="text-xs text-fg-muted mt-1.5 max-w-sm mx-auto leading-normal">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/**
 * Inline contextual cyber alert message.
 */
export const Notice: React.FC<{
  tone?: 'info' | 'success' | 'warning';
  children: React.ReactNode;
  onDismiss?: () => void;
}> = ({ tone = 'info', children, onDismiss }) => {
  const tones = {
    info: 'border-info/50 bg-info-soft text-fg shadow-[0_0_10px_rgba(0,240,255,0.15)]',
    success: 'border-success/50 bg-success-soft text-fg shadow-[0_0_10px_rgba(255,255,13,0.2)]',
    warning: 'border-warning/50 bg-warning-soft text-fg shadow-[0_0_10px_rgba(255,184,0,0.15)]',
  };

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 clip-cut-btn px-4 py-3 text-xs md:text-sm font-mono border ${tones[tone]}`}
    >
      <div className="min-w-0 leading-normal flex items-start gap-2">
        <span className="text-primary font-bold">&gt;&gt;</span>
        <span>{children}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-fg-muted hover:text-fg transition-colors"
          aria-label="Dismiss message"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
};
