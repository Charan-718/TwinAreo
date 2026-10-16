import React from 'react';
import { ACTION_LABEL, STATUS_LABEL } from '../../lib/format';
import { ActionCode, Status } from '../../lib/types';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-interactive text-fg-secondary border border-line',
  success: 'bg-success-soft text-success border border-success/40 shadow-[0_0_8px_rgba(0,255,157,0.15)]',
  warning: 'bg-warning-soft text-warning border border-warning/40 shadow-[0_0_8px_rgba(255,184,0,0.15)]',
  danger: 'bg-danger-soft text-danger border border-danger/40 shadow-[0_0_8px_rgba(255,0,85,0.2)]',
  info: 'bg-info-soft text-info border border-info/40 shadow-[0_0_8px_rgba(0,240,255,0.15)]',
  primary: 'bg-primary-soft text-primary-text border border-primary/40 shadow-[0_0_8px_rgba(0,255,157,0.15)]',
};

const dot: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  primary: 'bg-primary',
};

/**
 * Cut-corner status badge with cyber indicator dot and monospace brackets.
 */
export const Tag: React.FC<{
  tone?: Tone;
  children: React.ReactNode;
  withDot?: boolean;
  className?: string;
}> = ({ tone = 'neutral', children, withDot = true, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 h-6 px-2.5 clip-badge text-[11px] font-mono font-medium tracking-wider uppercase whitespace-nowrap ${tones[tone]} ${className}`}
  >
    {withDot && (
      <span
        className={`w-1.5 h-1.5 rounded-none ${dot[tone]} shadow-[0_0_4px_currentColor]`}
        aria-hidden="true"
      />
    )}
    <span>{children}</span>
  </span>
);

export const statusTone = (s: Status): Tone =>
  s === 'HEALTHY' ? 'success' : s === 'MONITOR' ? 'warning' : 'danger';

export const actionTone = (a: ActionCode): Tone =>
  a === 'CONTINUE' ? 'success' : a === 'INSPECT' ? 'warning' : 'danger';

export const StatusTag: React.FC<{ status: Status }> = ({ status }) => (
  <Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>
);

export const ActionTag: React.FC<{ action: ActionCode }> = ({ action }) => (
  <Tag tone={actionTone(action)}>{ACTION_LABEL[action]}</Tag>
);
