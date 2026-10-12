import React from 'react';
import { LineChart } from '../charts/LineChart';
import { HistoryPoint } from '../../lib/types';

/** Per-cycle RUL estimate with its 90% interval and the policy thresholds. */
export const RulTrajectory: React.FC<{ history: HistoryPoint[]; height?: number }> = ({ history, height = 280 }) => (
  <LineChart
    x={history.map((h) => h.cycle)}
    series={[{ id: 'rul', label: 'Predicted RUL', color: 'var(--chart-1)', values: history.map((h) => h.rul_pred) }]}
    band={{ lower: history.map((h) => h.rul_lower), upper: history.map((h) => h.rul_upper), color: 'var(--chart-1)', label: '90% interval' }}
    refLines={[{ y: 50, label: 'Inspect at 50' }, { y: 20, label: 'Remove at 20' }]}
    yDomain={[0, Math.max(140, ...history.map((h) => h.rul_upper)) + 5]}
    height={height}
    xLabel="Cycle"
    yLabel="Remaining cycles"
    formatY={(v) => v.toFixed(0)}
    ariaLabel={`Predicted remaining useful life over ${history.length} observed cycles, with 90% prediction interval. Latest estimate ${history[history.length - 1]?.rul_pred.toFixed(0)} cycles.`}
  />
);
