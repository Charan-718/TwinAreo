import React from 'react';
import { Plane, Cpu, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { EngineDetail, EngineSummary } from '../types';

interface HeaderProps {
  currentEngine: EngineDetail | null;
  fleet: EngineSummary[];
  selectedEngineId: number;
  onSelectEngine: (id: number) => void;
  onTriggerRecalibrate: () => void;
  isCalibrating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentEngine,
  fleet,
  selectedEngineId,
  onSelectEngine,
  onTriggerRecalibrate,
  isCalibrating,
}) => {
  const isDriftDetected = currentEngine?.drift_status?.drift_detected;

  return (
    <header className="sticky top-0 z-40 bg-avionics-850/90 backdrop-blur-md border-b border-avionics-border px-6 py-3 flex items-center justify-between">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider text-white">TwinAero</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                NASA FD004
              </span>
            </div>
            <p className="text-xs text-slate-400">Self-Calibrating Aerospace Digital Twin</p>
          </div>
        </div>
      </div>

      {/* Center Flight Envelope Badge */}
      {currentEngine && (
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-avionics-800/80 border border-slate-700/60 text-xs">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-slate-400 font-mono">Regime {currentEngine.operating_regime}: </span>
            <span className="text-slate-200 font-medium">{currentEngine.regime_name}</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-slate-300">Cycle {currentEngine.total_cycles_observed}</span>
        </div>
      )}

      {/* Right Controls: Engine Selector & Calibration Badge */}
      <div className="flex items-center gap-3">
        {/* Model Calibration Status */}
        <div className="flex items-center gap-2">
          {isDriftDetected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Drift Alert</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Model Calibrated</span>
            </div>
          )}

          <button
            onClick={onTriggerRecalibrate}
            disabled={isCalibrating}
            title="Trigger Digital Twin Self-Calibration"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-transparent hover:border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Engine Dropdown Selector */}
        <div className="flex items-center gap-2 bg-avionics-800 border border-avionics-border rounded-lg px-2.5 py-1">
          <span className="text-xs font-mono text-slate-400">ENGINE:</span>
          <select
            value={selectedEngineId}
            onChange={(e) => onSelectEngine(Number(e.target.value))}
            className="bg-transparent text-cyan-300 font-mono text-sm font-semibold focus:outline-none cursor-pointer"
          >
            {fleet.map((eng) => (
              <option key={eng.engine_id} value={eng.engine_id} className="bg-avionics-850 text-slate-200">
                {eng.unit_code} ({eng.status})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
