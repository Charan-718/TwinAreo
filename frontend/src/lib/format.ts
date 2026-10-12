import { ActionCode, FaultMode, Status } from './types';

export const fmt = {
  cycles: (n: number | null | undefined, digits = 0) => (n == null ? '–' : n.toFixed(digits)),
  num: (n: number | null | undefined, digits = 2) => (n == null ? '–' : n.toFixed(digits)),
  pct: (n: number | null | undefined, digits = 1) => (n == null ? '–' : `${n.toFixed(digits)}%`),
  signed: (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`,
  cyclesWord: (n: number) => `${n.toFixed(0)} ${Math.round(n) === 1 ? 'cycle' : 'cycles'}`,
  range: (lo: number, hi: number) => `${lo.toFixed(0)}–${hi.toFixed(0)}`,
};

export const STATUS_LABEL: Record<Status, string> = {
  HEALTHY: 'Healthy',
  MONITOR: 'Monitor',
  CRITICAL: 'Critical',
};

export const ACTION_LABEL: Record<ActionCode, string> = {
  REMOVE: 'Plan removal',
  INSPECT: 'Inspect',
  CONTINUE: 'Continue',
};

export const FAULT_SHORT: Record<FaultMode, string> = {
  HPC_DEGRADATION: 'HPC',
  FAN_DEGRADATION: 'Fan',
  NO_CLEAR_SIGNATURE: 'Unclear',
};

export const unitCode = (id: number) => `FD004-${String(id).padStart(3, '0')}`;
