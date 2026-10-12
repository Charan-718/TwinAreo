import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/** Page-shaped placeholder: title, a stat strip and two content blocks. */
export const PageSkeleton: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div role="status" aria-live="polite" className="space-y-6">
    <span className="sr-only">{label}</span>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-72 max-w-full" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
    <div className="bg-surface border border-line rounded-lg p-5 space-y-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-56 w-full" />
    </div>
  </div>
);

export const ErrorState: React.FC<{ title?: string; error: Error | null; onRetry?: () => void }> = ({
  title = 'Could not load this view', error, onRetry,
}) => (
  <div role="alert" className="border border-line rounded-lg bg-surface p-6 md:p-8 max-w-xl">
    <div className="flex items-start gap-3">
      <span className="text-danger mt-0.5"><Icon name="alert" /></span>
      <div className="space-y-2 min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-fg-secondary">{error?.message ?? 'An unexpected error occurred.'}</p>
        {onRetry && (
          <div className="pt-2">
            <Button size="sm" onClick={onRetry}>
              <Icon name="refresh" size={16} /> Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export const EmptyState: React.FC<{ title: string; children?: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="py-10 px-4 text-center">
    <p className="text-sm font-medium text-fg">{title}</p>
    {children && <p className="text-sm text-fg-muted mt-1 max-w-sm mx-auto">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Inline, non-blocking message (success / info / warning) with optional dismiss. */
export const Notice: React.FC<{ tone?: 'info' | 'success' | 'warning'; children: React.ReactNode; onDismiss?: () => void }> = ({
  tone = 'info', children, onDismiss,
}) => {
  const tones = { info: 'bg-info-soft text-fg', success: 'bg-success-soft text-fg', warning: 'bg-warning-soft text-fg' };
  return (
    <div role="status" className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm ${tones[tone]}`}>
      <div className="min-w-0">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-fg-muted hover:text-fg rounded-sm" aria-label="Dismiss message">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
};
