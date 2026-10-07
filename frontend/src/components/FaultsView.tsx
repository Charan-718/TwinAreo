import React from 'react';
import { EngineDetail } from '../types';
import { AlertOctagon, Flame, Wind } from 'lucide-react';

interface FaultsViewProps {
  engine: EngineDetail;
}

export const FaultsView: React.FC<FaultsViewProps> = ({ engine }) => {
  const isHPC = engine.fault_mode.includes('HPC');
  const isFan = engine.fault_mode.includes('FAN');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-cyan-400" />
              FD004 Fault Mode Diagnostic Diagnostics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              NASA C-MAPSS FD004 benchmark models two distinct physics degradation modes:
              High-Pressure Compressor (HPC) wear and Fan aerodynamic deterioration.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-avionics-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">Diagnosis:</span>
            <span className="text-cyan-300 font-bold">{engine.fault_label}</span>
          </div>
        </div>
      </div>

      {/* Degradation Mode Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HPC Card */}
        <div
          className={`glass-panel rounded-xl p-5 space-y-4 border transition ${
            isHPC ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-avionics-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                Mode 1: High-Pressure Compressor (HPC) Degradation
              </h3>
            </div>
            {isHPC && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ACTIVE IN ENGINE
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Characterized by compressor rotor blade tip clearance growth, surface erosion, and progressive seal leakage.
            Forces the core to work harder, increasing compressor discharge temperature.
          </p>

          <div className="space-y-2 p-3 bg-avionics-900 rounded-lg border border-avionics-border text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase block">Telemetry Sensor Signatures</span>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 3 (T30 Outlet Temp):</span>
              <span className="text-rose-400 font-bold">Progressive Rise (ΔT30 &gt; 0)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 7 (P30 Discharge Press):</span>
              <span className="text-cyan-400 font-bold">Pressure Drop (ΔP30 &lt; 0)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 12 (phi Fuel Ratio):</span>
              <span className="text-amber-400 font-bold">Compensatory Enrichment</span>
            </div>
          </div>
        </div>

        {/* Fan Card */}
        <div
          className={`glass-panel rounded-xl p-5 space-y-4 border transition ${
            isFan ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-avionics-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                Mode 2: Fan Aerodynamic Degradation
              </h3>
            </div>
            {isFan && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                ACTIVE IN ENGINE
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Arises from fan blade leading-edge roughness, acoustic liner boundary layer separation, and inlet guide vane erosion.
            Alters the balance between bypass duct airflow and core flow.
          </p>

          <div className="space-y-2 p-3 bg-avionics-900 rounded-lg border border-avionics-border text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase block">Telemetry Sensor Signatures</span>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 8 (Nf Fan Speed):</span>
              <span className="text-amber-400 font-bold">Rotational Frequency Drift</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 15 (BPR Bypass Ratio):</span>
              <span className="text-cyan-400 font-bold">Mass Flow Shift</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>• Sensor 6 (P15 Bypass Press):</span>
              <span className="text-slate-300 font-bold">Duct Discharge Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Anomalies List */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
          Active Engine Anomalies ({engine.active_anomalies.length})
        </h3>
        {engine.active_anomalies.length > 0 ? (
          <div className="space-y-2.5">
            {engine.active_anomalies.map((a, idx) => (
              <div
                key={idx}
                className="p-3 bg-avionics-900 rounded-lg border border-avionics-border flex items-start justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-bold text-white font-mono block">{a.component}</span>
                  <p className="text-xs text-slate-300 mt-0.5">{a.description}</p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    a.severity === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-avionics-900/60 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono text-center">
            No uncontained subsystem anomalies detected. Engine operating within nominal standard deviation envelope.
          </div>
        )}
      </div>
    </div>
  );
};
