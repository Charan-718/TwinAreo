import React, { useState } from 'react';
import { niceTicks, scale, useWidth } from './useSize';

export interface StackKey {
  key: string;
  label: string;
  color: string;
}

interface Props {
  bins: Array<{ label: string; counts: Record<string, number> }>;
  keys: StackKey[];
  height?: number;
  xLabel: string;
  ariaLabel: string;
}

/**
 * Vertical stacked histogram for fleet life-stage distribution.
 * Clean vector rendering with clear segment highlights on hover.
 */
export const StackedHistogram: React.FC<Props> = ({
  bins,
  keys,
  height = 220,
  xLabel,
  ariaLabel,
}) => {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 8, right: 8, bottom: 40, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const totals = bins.map((b) => keys.reduce((s, k) => s + (b.counts[k.key] || 0), 0));
  const maxY = Math.max(1, ...totals);
  const sy = scale(0, maxY, pad.top + innerH, pad.top);
  const bw = innerW / bins.length;

  return (
    <figure className="m-0">
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-xs text-fg-secondary list-none p-0 m-0">
        {keys.map((k) => (
          <li key={k.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: k.color }}
              aria-hidden="true"
            />
            <span>{k.label}</span>
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          {niceTicks(0, maxY, 4).map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={pad.left + innerW}
                y1={sy(t)}
                y2={sy(t)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text
                x={pad.left - 6}
                y={sy(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize="11"
                fill="var(--color-text-muted)"
                className="tabular"
              >
                {t}
              </text>
            </g>
          ))}
          {bins.map((b, i) => {
            let acc = 0;
            const x = pad.left + i * bw + 1;
            const isHovered = hover === i;
            return (
              <g
                key={b.label}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <rect x={x - 1} y={pad.top} width={bw} height={innerH} fill="transparent" />
                {keys.map((k) => {
                  const c = b.counts[k.key] || 0;
                  if (!c) return null;
                  const yTop = sy(acc + c);
                  const yBot = sy(acc);
                  acc += c;
                  return (
                    <rect
                      key={k.key}
                      x={x}
                      y={yTop + 1}
                      width={Math.max(1, bw - 2)}
                      height={Math.max(0, yBot - yTop - 2)}
                      fill={k.color}
                      fillOpacity={isHovered ? 1 : 0.82}
                      rx="2"
                      className="transition-opacity duration-fast"
                    />
                  );
                })}
                {i % Math.ceil(bins.length / Math.max(2, Math.floor(innerW / 48))) === 0 && (
                  <text
                    x={x + bw / 2}
                    y={pad.top + innerH + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--color-text-muted)"
                    className="tabular"
                  >
                    {b.label}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={pad.left}
            x2={pad.left + innerW}
            y1={pad.top + innerH}
            y2={pad.top + innerH}
            stroke="var(--chart-axis)"
            strokeWidth="1"
          />
          <text
            x={pad.left + innerW / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="11"
            fill="var(--color-text-muted)"
            className="font-medium"
          >
            {xLabel}
          </text>
        </svg>
        {hover != null && (
          <div
            className="absolute top-0 pointer-events-none border border-primary/50 bg-surface-elevated text-fg clip-cut-btn p-2.5 text-xs font-mono shadow-[0_0_15px_rgba(0,255,157,0.3)]"
            style={{
              left: Math.min(width - 160, pad.left + hover * bw + bw + 6),
            }}
          >
            <div className="font-bold text-primary mb-1.5 border-b border-line pb-1">
              <span className="text-primary/70 mr-1">{"//"}</span>{bins[hover].label} CYCLES
            </div>
            <div className="space-y-1">
              {keys.map((k) => (
                <div key={k.key} className="flex justify-between gap-4 text-fg-secondary">
                  <span>{k.label}</span>
                  <span className="text-fg font-medium tabular">{bins[hover].counts[k.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
};
