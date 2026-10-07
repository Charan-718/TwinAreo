import React, { useState } from 'react';
import { EngineTelemetryPoint } from '../types';
import { LineChart } from 'lucide-react';

interface SensorTimelineChartProps {
  history: EngineTelemetryPoint[];
}

type ChannelKey = 'T30' | 'P30' | 'Nf' | 'Ps30' | 'BPR' | 'health_pct';

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  color: string;
  unit: string;
  isSensor: boolean;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'health_pct', label: 'Health Index', color: '#10b981', unit: '%', isSensor: false },
  { key: 'T30', label: 'T30 (HPC Temp)', color: '#f43f5e', unit: '°R', isSensor: true },
  { key: 'P30', label: 'P30 (HPC Press)', color: '#38bdf8', unit: 'psia', isSensor: true },
  { key: 'Nf', label: 'Nf (Fan Speed)', color: '#f59e0b', unit: 'rpm', isSensor: true },
  { key: 'Ps30', label: 'Ps30 (Static Press)', color: '#a855f7', unit: 'psia', isSensor: true },
  { key: 'BPR', label: 'BPR (Bypass Ratio)', color: '#06b6d4', unit: '-', isSensor: true },
];

export const SensorTimelineChart: React.FC<SensorTimelineChartProps> = ({ history }) => {
  const [activeChannels, setActiveChannels] = useState<Record<ChannelKey, boolean>>({
    health_pct: true,
    T30: true,
    P30: true,
    Nf: false,
    Ps30: false,
    BPR: false,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-5 h-72 flex items-center justify-center text-slate-500 font-mono text-xs">
        Telemetry stream pending...
      </div>
    );
  }

  const toggleChannel = (key: ChannelKey) => {
    setActiveChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minCycle = history[0].cycle;
  const maxCycle = history[history.length - 1].cycle;
  const cycleSpan = Math.max(1, maxCycle - minCycle);

  // Compute normalized Y coordinate for a channel value
  const getCoordinates = (ch: ChannelConfig) => {
    const rawValues = history.map((pt) => {
      if (ch.isSensor) {
        return (pt.key_sensors as any)[ch.key] || 0;
      }
      return (pt as any)[ch.key] || 0;
    });

    const minVal = Math.min(...rawValues);
    const maxVal = Math.max(...rawValues);
    const span = Math.max(0.001, maxVal - minVal);

    const points = history.map((pt, i) => {
      const x = padding.left + ((pt.cycle - minCycle) / cycleSpan) * innerWidth;
      const normalizedY = (rawValues[i] - minVal) / span;
      const y = padding.top + innerHeight - normalizedY * innerHeight;
      return { x, y, val: rawValues[i], cycle: pt.cycle };
    });

    // Build SVG path d
    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return { pathD, points, minVal, maxVal };
  };

  const hoveredPoint = hoverIndex !== null ? history[hoverIndex] : null;

  return (
    <div className="glass-panel rounded-xl p-5">
      {/* Title & Channel Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Sensor / Degradation Timeline
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            ({minCycle} → {maxCycle} Cycles)
          </span>
        </div>

        {/* Channel toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CHANNELS.map((ch) => {
            const isActive = activeChannels[ch.key];
            return (
              <button
                key={ch.key}
                onClick={() => toggleChannel(ch.key)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5 transition border ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border-slate-600'
                    : 'bg-transparent text-slate-500 border-slate-800 hover:text-slate-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? ch.color : '#475569' }}
                />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerHeight * pct;
            return (
              <line
                key={pct}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Time axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const x = padding.left + innerWidth * pct;
            const cycleVal = Math.round(minCycle + cycleSpan * pct);
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 4}
                  stroke="rgba(255, 255, 255, 0.2)"
                />
                <text
                  x={x}
                  y={height - 8}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  C{cycleVal}
                </text>
              </g>
            );
          })}

          {/* Active Lines */}
          {CHANNELS.map((ch) => {
            if (!activeChannels[ch.key]) return null;
            const { pathD, points } = getCoordinates(ch);

            return (
              <g key={ch.key}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: `drop-shadow(0 0 6px ${ch.color}40)`,
                  }}
                />
                {hoverIndex !== null && points[hoverIndex] && (
                  <circle
                    cx={points[hoverIndex].x}
                    cy={points[hoverIndex].y}
                    r="4"
                    fill={ch.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}

          {/* Hover tracker line */}
          {hoverIndex !== null && (
            <line
              x1={padding.left + (hoverIndex / (history.length - 1)) * innerWidth}
              y1={padding.top}
              x2={padding.left + (hoverIndex / (history.length - 1)) * innerWidth}
              y2={height - padding.bottom}
              stroke="rgba(6, 182, 212, 0.5)"
              strokeDasharray="3 3"
            />
          )}

          {/* Transparent interactive overlay rects */}
          {history.map((pt, i) => {
            const stepX = innerWidth / history.length;
            const x = padding.left + i * stepX - stepX / 2;
            return (
              <rect
                key={pt.cycle}
                x={x}
                y={padding.top}
                width={stepX}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>

        {/* Hover telemetry callout */}
        {hoveredPoint && (
          <div className="mt-2 p-2 bg-avionics-900/90 rounded border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-bold">Cycle {hoveredPoint.cycle}:</span>
            <div className="flex gap-4 text-slate-300">
              <span>Health: <strong className="text-emerald-400">{hoveredPoint.health_pct}%</strong></span>
              <span>T30: <strong>{hoveredPoint.key_sensors.T30}°R</strong></span>
              <span>P30: <strong>{hoveredPoint.key_sensors.P30}psia</strong></span>
              <span>Nf: <strong>{hoveredPoint.key_sensors.Nf}rpm</strong></span>
              <span>BPR: <strong>{hoveredPoint.key_sensors.BPR}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
