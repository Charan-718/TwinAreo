import React, { useMemo, useState } from 'react';
import { niceTicks, scale, useWidth } from './useSize';

export interface Series {
  id: string;
  label: string;
  color: string;            // CSS color, normally var(--chart-n)
  values: Array<number | null>;
  dashed?: boolean;         // reserved for projections and references, never for grid
  connectNulls?: boolean;   // draw across missing values (sparse series on a shared x grid)
  markers?: boolean;        // show a dot at every value (sparse series)
}

export interface Band {
  lower: number[];
  upper: number[];
  color: string;
  label: string;
}

export interface RefLine {
  y: number;
  label: string;
}

interface LineChartProps {
  x: number[];
  series: Series[];
  band?: Band;
  refLines?: RefLine[];
  height?: number;
  yDomain?: [number, number];
  xLabel?: string;
  yLabel?: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  ariaLabel: string;
  showLegend?: boolean;
  compact?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  x,
  series,
  band,
  refLines = [],
  height = 260,
  yDomain,
  xLabel,
  yLabel,
  formatX = (v) => String(Math.round(v)),
  formatY = (v) => String(Math.round(v * 100) / 100),
  ariaLabel,
  showLegend,
  compact = false,
}) => {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = compact
    ? { top: 8, right: 8, bottom: 20, left: 36 }
    : { top: 12, right: 16, bottom: xLabel ? 40 : 28, left: yLabel ? 56 : 44 };
  const innerW = Math.max(10, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const [y0, y1] = useMemo(() => {
    if (yDomain) return yDomain;
    const vals: number[] = [];
    series.forEach((s) => s.values.forEach((v) => v != null && vals.push(v)));
    if (band) vals.push(...band.lower, ...band.upper);
    refLines.forEach((r) => vals.push(r.y));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const padY = (hi - lo || 1) * 0.08;
    return [lo - padY, hi + padY];
  }, [series, band, refLines, yDomain]);

  const xMin = x[0] ?? 0;
  const xMax = x[x.length - 1] ?? 1;
  const sx = scale(xMin, xMax, pad.left, pad.left + innerW);
  const sy = scale(y0, y1, pad.top + innerH, pad.top);
  const yTicks = niceTicks(y0, y1, compact ? 3 : 5).filter((t) => t >= y0 && t <= y1);
  const xTicks = niceTicks(xMin, xMax, Math.max(2, Math.min(8, Math.floor(innerW / 90)))).filter((t) => t >= xMin && t <= xMax);

  const path = (vals: Array<number | null>, connect = false) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v == null) {
        if (!connect) pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${sx(x[i]).toFixed(1)},${sy(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const bandPath = band
    ? `M${x.map((xi, i) => `${sx(xi).toFixed(1)},${sy(band.upper[i]).toFixed(1)}`).join('L')}` +
      `L${x.map((xi, i) => `${sx(xi).toFixed(1)},${sy(band.lower[i]).toFixed(1)}`).reverse().join('L')}Z`
    : '';

  const nearest = (px: number) => {
    let best = 0;
    let bestD = Infinity;
    x.forEach((xi, i) => {
      const d = Math.abs(sx(xi) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setHover(nearest(e.clientX - rect.left));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setHover((h) => Math.min(x.length - 1, (h ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? x.length) - 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

  const legend = showLegend ?? (series.length > 1 || !!band);
  const tipLeft = hover != null ? sx(x[hover]) : 0;
  const tipOnRight = tipLeft < width * 0.6;

  return (
    <figure className="m-0">
      {legend && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-xs text-fg-secondary list-none p-0 m-0">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <svg width="16" height="8" aria-hidden="true">
                <line
                  x1="0"
                  x2="16"
                  y1="4"
                  y2="4"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeDasharray={s.dashed ? '4 3' : undefined}
                />
              </svg>
              <span>{s.label}</span>
            </li>
          ))}
          {band && (
            <li className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-2 rounded-sm"
                style={{ background: band.color, opacity: 0.3 }}
                aria-hidden="true"
              />
              <span>{band.label}</span>
            </li>
          )}
          {refLines.map((r) => (
            <li key={r.label} className="flex items-center gap-1.5">
              <svg width="16" height="8" aria-hidden="true">
                <line
                  x1="0"
                  x2="16"
                  y1="4"
                  y2="4"
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </svg>
              <span>{r.label}</span>
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block overflow-visible"
        >
          {/* Horizontal Grid lines */}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line
                x1={pad.left}
                x2={pad.left + innerW}
                y1={sy(t)}
                y2={sy(t)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text
                x={pad.left - 8}
                y={sy(t)}
                dy="0.32em"
                textAnchor="end"
                fill="var(--color-text-muted)"
                className="tabular text-[11px]"
              >
                {formatY(t)}
              </text>
            </g>
          ))}
          <line
            x1={pad.left}
            x2={pad.left + innerW}
            y1={pad.top + innerH}
            y2={pad.top + innerH}
            stroke="var(--chart-axis)"
            strokeWidth="1"
          />
          {xTicks.map((t) => (
            <text
              key={`x${t}`}
              x={sx(t)}
              y={pad.top + innerH + 16}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              className="tabular text-[11px]"
            >
              {formatX(t)}
            </text>
          ))}
          {xLabel && (
            <text
              x={pad.left + innerW / 2}
              y={height - 4}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              className="text-[11px] font-medium"
            >
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text
              transform={`translate(12 ${pad.top + innerH / 2}) rotate(-90)`}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              className="text-[11px] font-medium"
            >
              {yLabel}
            </text>
          )}

          {band && (
            <path
              d={bandPath}
              fill={band.color}
              style={{ fillOpacity: "var(--chart-band-opacity)" as unknown as number }}
              stroke="none"
            />
          )}

          {refLines.map((r) => (
            <line
              key={r.label}
              x1={pad.left}
              x2={pad.left + innerW}
              y1={sy(r.y)}
              y2={sy(r.y)}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Precision Series lines */}
          {series.map((s) => (
            <g key={s.id}>
              <path
                d={path(s.values, s.connectNulls)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '5 4' : undefined}
              />
              {s.markers &&
                s.values.map(
                  (v, i) =>
                    v != null && (
                      <circle
                        key={i}
                        cx={sx(x[i])}
                        cy={sy(v)}
                        r="3.5"
                        fill={s.color}
                        stroke="var(--color-surface)"
                        strokeWidth="1.5"
                      />
                    ),
                )}
            </g>
          ))}

          {hover != null && (
            <g pointerEvents="none">
              <line
                x1={sx(x[hover])}
                x2={sx(x[hover])}
                y1={pad.top}
                y2={pad.top + innerH}
                stroke="var(--color-text-muted)"
                strokeOpacity="0.6"
                strokeDasharray="3 3"
              />
              {series.map(
                (s) =>
                  s.values[hover] != null && (
                    <circle
                      key={s.id}
                      cx={sx(x[hover])}
                      cy={sy(s.values[hover] as number)}
                      r="4"
                      fill={s.color}
                      stroke="var(--color-surface)"
                      strokeWidth="2"
                    />
                  ),
              )}
            </g>
          )}

          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ cursor: 'crosshair', touchAction: 'pan-y' }}
          />
        </svg>

        {hover != null && (
          <div
            className="absolute top-1 z-10 pointer-events-none border border-primary/50 bg-surface-elevated text-fg clip-cut-btn p-2.5 text-xs shadow-[0_0_15px_rgba(255,255,13,0.35)] min-w-[10rem] font-mono"
            style={tipOnRight ? { left: tipLeft + 12 } : { right: width - tipLeft + 12 }}
          >
            <div className="font-bold text-primary mb-1.5 tabular border-b border-line pb-1">
              <span className="text-primary/70 mr-1">{"//"}</span>{xLabel ? `${xLabel} ` : ''}{formatX(x[hover])}
            </div>
            <div className="space-y-1">
              {series.map(
                (s) =>
                  s.values[hover] != null && (
                    <div key={s.id} className="flex items-center justify-between gap-3 text-fg-secondary">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: s.color }}
                          aria-hidden="true"
                        />
                        {s.label}
                      </span>
                      <span className="text-fg font-medium tabular">{formatY(s.values[hover] as number)}</span>
                    </div>
                  ),
              )}
              {band && (
                <div className="flex items-center justify-between gap-3 text-fg-secondary">
                  <span>{band.label}</span>
                  <span className="text-fg font-medium tabular">
                    {formatY(band.lower[hover])}–{formatY(band.upper[hover])}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
};
