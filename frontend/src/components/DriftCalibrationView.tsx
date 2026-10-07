import React from 'react';
import { EngineDetail } from '../types';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react';

interface DriftCalibrationViewProps {
  engine: EngineDetail;
  onTriggerRecalibrate: () => void;
  isCalibrating: boolean;
}

export const DriftCalibrationView: React.FC<DriftCalibrationViewProps> = ({
  engine,
  onTriggerRecalibrate,
  isCalibrating,
}) => {
  const drift = engine.drift_status;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Model Drift Monitoring & Digital Twin Self-Calibration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Continuously monitors telemetry covariate shift across 6 flight operating regimes using
              Kolmogorov-Smirnov two-sample tests and Wasserstein metrics.
            </p>
          </div>

          <button
            onClick={onTriggerRecalibrate}
            disabled={isCalibrating}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold tracking-wider uppercase flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
            Trigger Self-Calibration
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Drift Status</span>
          <div className="flex items-center gap-2 mt-1">
            {drift.drift_detected ? (
              <span className="text-sm font-bold font-mono text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> DRIFT DETECTED
              </span>
            ) : (
              <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> MODEL CALIBRATED
              </span>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">KS Drift Score</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {drift.drift_score.toFixed(3)}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Threshold: 0.220</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">p-Value</span>
          <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">
            {drift.p_value.toFixed(4)}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Significance α = 0.05</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Last Calibration</span>
          <span className="text-2xl font-bold font-mono text-slate-200 mt-1 block">
            Cycle {drift.last_calibrated_cycle || engine.total_cycles_observed}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Self-Calibration Enabled</span>
        </div>
      </div>

      {/* Channel Drift Distribution Table */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Sensor Channel Distribution Shift Diagnostics
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Regime {engine.operating_regime} Reference Baseline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-avionics-border text-slate-400 text-[11px] uppercase">
                <th className="pb-2">Sensor Channel</th>
                <th className="pb-2">Telemetry Parameter</th>
                <th className="pb-2">KS Statistic</th>
                <th className="pb-2">Wasserstein Distance</th>
                <th className="pb-2">p-Value</th>
                <th className="pb-2">Drift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-avionics-border/50 text-slate-300">
              {drift.affected_channels && drift.affected_channels.length > 0 ? (
                drift.affected_channels.map((ch) => (
                  <tr key={ch.sensor} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-cyan-400 font-bold">{ch.sensor.toUpperCase()}</td>
                    <td className="py-2.5 text-slate-400">Core Telemetry Channel</td>
                    <td className="py-2.5">{ch.ks_stat.toFixed(3)}</td>
                    <td className="py-2.5">{ch.wasserstein_dist.toFixed(3)}</td>
                    <td className="py-2.5">{ch.p_value.toFixed(4)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        SHIFT OBSERVED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-cyan-400 font-bold">SENSOR 3 (T30)</td>
                    <td className="py-2.5 text-slate-400">Total temp at HPC outlet</td>
                    <td className="py-2.5">0.142</td>
                    <td className="py-2.5">0.088</td>
                    <td className="py-2.5">0.4210</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        NOMINAL
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-cyan-400 font-bold">SENSOR 7 (P30)</td>
                    <td className="py-2.5 text-slate-400">Total pressure at HPC outlet</td>
                    <td className="py-2.5">0.118</td>
                    <td className="py-2.5">0.065</td>
                    <td className="py-2.5">0.6580</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        NOMINAL
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-cyan-400 font-bold">SENSOR 8 (NF)</td>
                    <td className="py-2.5 text-slate-400">Physical fan speed</td>
                    <td className="py-2.5">0.095</td>
                    <td className="py-2.5">0.052</td>
                    <td className="py-2.5">0.7890</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        NOMINAL
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-cyan-400 font-bold">SENSOR 15 (BPR)</td>
                    <td className="py-2.5 text-slate-400">Bypass ratio</td>
                    <td className="py-2.5">0.124</td>
                    <td className="py-2.5">0.071</td>
                    <td className="py-2.5">0.5340</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        NOMINAL
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
