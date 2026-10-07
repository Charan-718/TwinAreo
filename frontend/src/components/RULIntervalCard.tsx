import React from 'react';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RULIntervalCardProps {
  rulPred: number;
  rulLower: number;
  rulUpper: number;
  confidencePct?: number;
  unitCode: string;
}

export const RULIntervalCard: React.FC<RULIntervalCardProps> = ({
  rulPred,
  rulLower,
  rulUpper,
  confidencePct = 90,
  unitCode,
}) => {
  // Compute percentage position for the point inside the interval bar
  const normalizedLower = Math.max(0, rulLower);
  const minAxis = Math.max(0, normalizedLower - 8);
  const maxAxis = rulUpper + 10;
  const axisRange = maxAxis - minAxis;

  const pointPct = Math.min(95, Math.max(5, ((rulPred - minAxis) / axisRange) * 100));
  const lowerPct = Math.min(90, Math.max(5, ((normalizedLower - minAxis) / axisRange) * 100));
  const upperPct = Math.min(98, Math.max(15, ((rulUpper - minAxis) / axisRange) * 100));
  const barWidth = Math.max(4, upperPct - lowerPct);

  const isUrgent = rulPred < 30;

  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Remaining Useful Life (RUL)
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          {confidencePct}% Conformal Interval
        </span>
      </div>

      {/* Main Big RUL Metric */}
      <div className="my-3 flex items-baseline justify-between">
        <div>
          <span className="text-5xl font-extrabold font-mono text-white tracking-tight">
            {rulPred}
          </span>
          <span className="text-sm font-mono text-cyan-400 ml-2 uppercase font-medium">cycles</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-mono block">PI Bounds:</span>
          <span className="text-sm font-mono font-semibold text-slate-200">
            [{normalizedLower.toFixed(0)} — {rulUpper.toFixed(0)}] cycles
          </span>
        </div>
      </div>

      {/* Visual Prediction Interval Line (ASCII mockup match) */}
      <div className="my-2 p-3 bg-avionics-900/80 rounded-lg border border-avionics-border">
        <div className="text-[10px] font-mono text-slate-400 flex justify-between uppercase mb-1">
          <span>Lower Bound: {normalizedLower.toFixed(0)}</span>
          <span className="text-cyan-400 font-bold">● Point: {rulPred.toFixed(0)}</span>
          <span>Upper Bound: {rulUpper.toFixed(0)}</span>
        </div>

        {/* The Horizon Bar */}
        <div className="relative h-6 flex items-center">
          {/* Axis Track */}
          <div className="w-full h-1 bg-slate-800 rounded-full" />

          {/* Shaded Prediction Interval Range */}
          <div
            className="absolute h-2.5 bg-cyan-500/30 border-y border-cyan-400/60 rounded"
            style={{
              left: `${lowerPct}%`,
              width: `${barWidth}%`,
            }}
          />

          {/* Lower Bracket Tick */}
          <div
            className="absolute w-0.5 h-4 bg-cyan-400 -translate-x-1/2"
            style={{ left: `${lowerPct}%` }}
          />

          {/* Upper Bracket Tick */}
          <div
            className="absolute w-0.5 h-4 bg-cyan-400 -translate-x-1/2"
            style={{ left: `${upperPct}%` }}
          />

          {/* Point Estimate Dot */}
          <div
            className="absolute w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-[0_0_10px_#22d3ee] -translate-x-1/2 transition-all duration-500"
            style={{ left: `${pointPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
          <span>{minAxis.toFixed(0)}</span>
          <span className="text-cyan-300/80">Coverage Guarantee: Valid under exchangeability</span>
          <span>{maxAxis.toFixed(0)}</span>
        </div>
      </div>

      {/* Airworthiness Dispatch Recommendation */}
      <div className="mt-2 pt-2 border-t border-avionics-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          {isUrgent ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            {isUrgent
              ? `Safe dispatch limit: ${Math.max(1, Math.floor(normalizedLower * 0.8))} cycles`
              : 'Within safe dispatch threshold for scheduled turnarounds'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">FD004 NASA Model</span>
      </div>
    </div>
  );
};
