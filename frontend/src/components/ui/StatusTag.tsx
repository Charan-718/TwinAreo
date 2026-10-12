import React from 'react';
import { ACTION_LABEL, STATUS_LABEL } from '../../lib/format';
import { ActionCode, Status } from '../../lib/types';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-interactive text-fg-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  primary: 'bg-primary-soft text-primary-text',
};

const dot: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  primary: 'bg-primary',
};

/** Compact state label. Color always travels with text, never alone. */
export const Tag: React.FC<{ tone?: Tone; children: React.ReactNode; withDot?: boolean; className?: string }> = ({
  tone = 'neutral', children, withDot = true, className = '',
}) => (
  <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-sm text-xs font-medium whitespace-nowrap ${tones[tone]} ${className}`}>
    {withDot && <span className={`w-1.5 h-1.5 rounded-full ${dot[tone]}`} aria-hidden="true" />}
    {children}
  </span>
);

export const statusTone = (s: Status): Tone => (s === 'HEALTHY' ? 'success' : s === 'MONITOR' ? 'warning' : 'danger');
export const actionTone = (a: ActionCode): Tone => (a === 'CONTINUE' ? 'success' : a === 'INSPECT' ? 'warning' : 'danger');

export const StatusTag: React.FC<{ status: Status }> = ({ status }) => <Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>;
export const ActionTag: React.FC<{ action: ActionCode }> = ({ action }) => <Tag tone={actionTone(action)}>{ACTION_LABEL[action]}</Tag>;
