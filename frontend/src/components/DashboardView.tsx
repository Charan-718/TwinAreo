import React from 'react';
import { EngineDetail } from '../types';
import { HealthGauge } from './HealthGauge';
import { RULIntervalCard } from './RULIntervalCard';
import { SensorTimelineChart } from './SensorTimelineChart';
import { DigitalTwinEngineView } from './DigitalTwinEngineView';
import { AlertTriangle, ShieldCheck, ArrowUpRight, Bot } from 'lucide-react';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  engine: EngineDetail;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ engine, onNavigate }) => {
  const isDrift = engine.drift_status?.drift_detected;

  return (
    <div className="space-y-6">
      {/* Top Cockpit Row: Health Gauge + RUL Interval + Operating Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Health Gauge */}
        <div className="md:col-span-4">
          <HealthGauge
            healthPct={engine.health_pct}
            status={engine.status}
            hpcScore={engine.fault_mode.includes('HPC') ? 1.45 : 0.45}
            fanScore={engine.fault_mode.includes('FAN') ? 1.35 : 0.40}
          />
        </div>

        {/* Center: RUL & Conformal Prediction Interval */}
        <div className="md:col-span-5">
          <RULIntervalCard
            rulPred={engine.rul_pred}
            rulLower={engine.rul_lower}
            rulUpper={engine.rul_upper}
            confidencePct={engine.confidence_pct}
            unitCode={engine.unit_code}
          />
        </div>

        {/* Right: Flight Envelope & Status Indicators */}
        <div className="md:col-span-3 glass-panel rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Status & Calibration
            </span>

            {/* Degradation Pattern Alert */}
            <div
              className={`p-3 rounded-lg border text-xs font-mono mb-2 flex items-start gap-2 ${
                engine.fault_mode !== 'NORMAL_HEALTHY'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {engine.fault_mode !== 'NORMAL_HEALTHY' ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              )}
              <div>
                <span className="font-bold block">
                  {engine.fault_mode !== 'NORMAL_HEALTHY'
                    ? '⚠ Degradation pattern detected'
                    : 'Nominal baseline operational'}
                </span>
                <span className="text-[11px] text-slate-300 opacity-90">{engine.fault_label}</span>
              </div>
            </div>

            {/* Calibration Status Badge */}
            <div className="p-2.5 rounded-lg bg-avionics-900 border border-avionics-border flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Digital Twin:</span>
              <span
                className={`flex items-center gap-1.5 font-semibold ${
                  isDrift ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {isDrift ? 'Drift Observed' : 'Model Calibrated'}
              </span>
            </div>
          </div>

          {/* Quick AI Advisor Recommendation Banner */}
          <button
            onClick={() => onNavigate('advisor')}
            className="w-full p-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-mono text-left flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>AI Advisor Guidance</span>
            </div>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </button>
        </div>
      </div>

      {/* Middle Row: Sensor / Degradation Timeline */}
      <SensorTimelineChart history={engine.telemetry_history} />

      {/* Bottom Section: Turbofan Schematic Preview & Telemetry Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DigitalTwinEngineView engine={engine} />
        </div>

        {/* Live Active Telemetry Channel Grid */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Latest Sensor Channels
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">21 C-MAPSS Channels</span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {engine.latest_sensors.slice(0, 10).map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded bg-avionics-900/80 border border-slate-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{s.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{s.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-100 font-semibold">{s.raw_value.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('faults')}
            className="w-full mt-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition text-center"
          >
            Inspect All 21 Channels & Anomalies →
          </button>
        </div>
      </div>
    </div>
  );
};
