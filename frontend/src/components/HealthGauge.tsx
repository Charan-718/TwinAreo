import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface HealthGaugeProps {
  healthPct: number;
  status: 'HEALTHY' | 'MONITOR' | 'CRITICAL';
  hpcScore?: number;
  fanScore?: number;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  healthPct,
  status,
  hpcScore = 0.8,
  fanScore = 0.5,
}) => {
  // SVG circular gauge math
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthPct / 100) * circumference;

  let strokeColor = '#10b981'; // emerald
  let statusBadgeBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
  let StatusIcon = ShieldCheck;

  if (status === 'MONITOR') {
    strokeColor = '#f59e0b'; // amber
    statusBadgeBg = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    StatusIcon = AlertTriangle;
  } else if (status === 'CRITICAL') {
    strokeColor = '#f43f5e'; // rose
    statusBadgeBg = 'bg-rose-500/15 border-rose-500/40 text-rose-300';
    StatusIcon = AlertCircle;
  }

  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col items-center justify-between relative overflow-hidden">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Engine Health</span>
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs border font-medium ${statusBadgeBg}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status}</span>
        </div>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative flex items-center justify-center my-2">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Gradient Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${strokeColor}44)`,
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
            {healthPct}%
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Degradation Index
          </span>
        </div>
      </div>

      {/* Subsystem Health Microbars */}
      <div className="w-full grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-avionics-border">
        <div className="bg-avionics-900/60 p-2.5 rounded-lg border border-avionics-border">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400 font-mono">HPC Stress</span>
            <span className={`font-mono font-medium ${hpcScore > 1.0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {hpcScore.toFixed(2)}σ
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hpcScore > 1.2 ? 'bg-rose-500' : hpcScore > 0.7 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (hpcScore / 2.0) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-avionics-900/60 p-2.5 rounded-lg border border-avionics-border">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400 font-mono">Fan Stress</span>
            <span className={`font-mono font-medium ${fanScore > 1.0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {fanScore.toFixed(2)}σ
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fanScore > 1.2 ? 'bg-rose-500' : fanScore > 0.7 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (fanScore / 2.0) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
