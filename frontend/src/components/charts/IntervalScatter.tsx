import React, { useState } from 'react';
import { niceTicks, scale, useWidth } from './useSize';

export interface IntervalPoint {
  id: number;
  x: number;        // true value
  y: number;        // prediction
  lo: number;
  hi: number;
  covered: boolean;
}

/** Predicted vs. true with interval whiskers; the diagonal marks perfect prediction. */
export const IntervalScatter: React.FC<{ points: IntervalPoint[]; max?: number; height?: number; ariaLabel: string }> = ({
  points, max = 130, height = 340, ariaLabel,
}) => {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<IntervalPoint | null>(null);
  const pad = { top: 12, right: 16, bottom: 40, left: 52 };
  const size = Math.min(width - pad.left - pad.right, height - pad.top - pad.bottom);
  const sx = scale(0, max, pad.left, pad.left + size);
  const sy = scale(0, max, pad.top + size, pad.top);
  const ticks = niceTicks(0, max, 5);

  return (
    <figure className="m-0">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-fg-secondary list-none p-0 m-0">
        <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-1)' }} aria-hidden="true" />True RUL inside 90% interval</li>
        <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-2)' }} aria-hidden="true" />Outside interval</li>
      </ul>
      <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
        <svg width={width} height={size + pad.top + pad.bottom} role="img" aria-label={ariaLabel} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + size} y1={sy(t)} y2={sy(t)} stroke="var(--chart-grid)" />
              <text x={pad.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize="11" className="fill-fg-muted tabular">{t}</text>
              <text x={sx(t)} y={pad.top + size + 16} textAnchor="middle" fontSize="11" className="fill-fg-muted tabular">{t}</text>
            </g>
          ))}
          <line x1={sx(0)} y1={sy(0)} x2={sx(max)} y2={sy(max)} stroke="var(--color-border-strong)" />
          <text x={pad.left + size / 2} y={pad.top + size + 34} textAnchor="middle" fontSize="11" className="fill-fg-muted">True RUL (cycles, capped at 125)</text>
          <text transform={`translate(12 ${pad.top + size / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" className="fill-fg-muted">Predicted RUL</text>
          {points.map((p) => {
            const color = p.covered ? 'var(--chart-1)' : 'var(--chart-2)';
            return (
              <g key={p.id} onPointerEnter={() => setHover(p)} onPointerLeave={() => setHover(null)}>
                <line x1={sx(p.x)} x2={sx(p.x)} y1={sy(Math.min(max, p.lo))} y2={sy(Math.min(max, p.hi))} stroke={color} strokeOpacity="0.35" />
                <circle cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={color} stroke="var(--color-surface)" strokeWidth="1.5" />
                <circle cx={sx(p.x)} cy={sy(p.y)} r="9" fill="transparent" />
              </g>
            );
          })}
        </svg>
        {hover && (
          <div className="absolute pointer-events-none bg-surface-elevated border border-line rounded-md shadow-md px-3 py-2 text-xs"
            style={{ left: Math.min(width - 170, sx(hover.x) + 12), top: Math.max(0, sy(hover.y) - 50) }}>
            <div className="font-medium text-fg mb-1">FD004-{String(hover.id).padStart(3, '0')}</div>
            <div className="text-fg-secondary tabular">True {hover.x.toFixed(0)} · predicted {hover.y.toFixed(0)}</div>
            <div className="text-fg-secondary tabular">90% interval {hover.lo.toFixed(0)}–{hover.hi.toFixed(0)}</div>
          </div>
        )}
      </div>
    </figure>
  );
};
