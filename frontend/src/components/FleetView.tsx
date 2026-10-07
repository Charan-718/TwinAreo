import React, { useState } from 'react';
import { EngineSummary } from '../types';
import { Search, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface FleetViewProps {
  fleet: EngineSummary[];
  selectedEngineId: number;
  onSelectEngine: (id: number) => void;
  healthyCount: number;
  monitorCount: number;
  criticalCount: number;
  meanRul: number;
}

export const FleetView: React.FC<FleetViewProps> = ({
  fleet,
  selectedEngineId,
  onSelectEngine,
  healthyCount,
  monitorCount,
  criticalCount,
  meanRul,
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = fleet.filter((e) => {
    const matchSearch =
      e.unit_code.toLowerCase().includes(search.toLowerCase()) ||
      e.engine_id.toString().includes(search);
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Engines</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{fleet.length}</span>
          <span className="text-[10px] font-mono text-slate-500">C-MAPSS FD004</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block">Healthy Engines</span>
          <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block">{healthyCount}</span>
          <span className="text-[10px] font-mono text-slate-500">Health &ge; 75%</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-amber-400 block">Monitor State</span>
          <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">{monitorCount}</span>
          <span className="text-[10px] font-mono text-slate-500">45% &le; Health &lt; 75%</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-rose-400 block">Critical Units</span>
          <span className="text-2xl font-bold font-mono text-rose-300 mt-1 block">{criticalCount}</span>
          <span className="text-[10px] font-mono text-slate-500">Health &lt; 45%</span>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-cyan-400 block">Mean Fleet RUL</span>
          <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">{meanRul}</span>
          <span className="text-[10px] font-mono text-slate-500">Remaining Cycles</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search engine unit (e.g. 117)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-avionics-900 border border-avionics-border rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {['ALL', 'HEALTHY', 'MONITOR', 'CRITICAL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition border ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-avionics-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Engines Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-avionics-850 border-b border-avionics-border text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Engine Unit</th>
                <th className="py-3 px-4">Flight Cycles</th>
                <th className="py-3 px-4">Health Index</th>
                <th className="py-3 px-4">Predicted RUL</th>
                <th className="py-3 px-4">90% Prediction Interval</th>
                <th className="py-3 px-4">Fault Mode</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-avionics-border/60 text-slate-300">
              {filtered.map((eng) => {
                const isSelected = selectedEngineId === eng.engine_id;
                return (
                  <tr
                    key={eng.engine_id}
                    onClick={() => onSelectEngine(eng.engine_id)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-500/15 text-white'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-400">{eng.unit_code}</span>
                      {eng.status === 'CRITICAL' && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {eng.status === 'MONITOR' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {eng.status === 'HEALTHY' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </td>
                    <td className="py-3 px-4">{eng.current_cycle}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-10">{eng.health_pct}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              eng.health_pct > 75
                                ? 'bg-emerald-400'
                                : eng.health_pct > 45
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${eng.health_pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {eng.rul_pred} <span className="text-slate-500 font-normal">cyc</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      [{eng.rul_lower} — {eng.rul_upper}] cyc
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          eng.fault_mode.includes('HPC')
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : eng.fault_mode.includes('FAN')
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {eng.fault_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEngine(eng.engine_id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 text-[11px] border border-slate-700 hover:border-cyan-400 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
