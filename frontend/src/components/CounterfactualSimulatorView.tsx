import React, { useState, useEffect, useCallback } from 'react';
import { EngineDetail, CounterfactualResponse } from '../types';
import { runCounterfactual } from '../api';
import { Sliders, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

interface CounterfactualSimulatorViewProps {
  engine: EngineDetail;
}

export const CounterfactualSimulatorView: React.FC<CounterfactualSimulatorViewProps> = ({ engine }) => {
  const [altitude, setAltitude] = useState<number>(35.0);
  const [mach, setMach] = useState<number>(0.80);
  const [throttle, setThrottle] = useState<number>(100.0);
  const [result, setResult] = useState<CounterfactualResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const executeSimulation = useCallback(async (alt: number, m: number, thr: number) => {
    setLoading(true);
    try {
      const res = await runCounterfactual(engine.engine_id, {
        altitude_kft: alt,
        mach_number: m,
        throttle_pct: thr,
      });
      setResult(res);
    } catch (err) {
      console.error('Counterfactual simulation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [engine.engine_id]);

  useEffect(() => {
    executeSimulation(altitude, mach, throttle);
  }, [executeSimulation, altitude, mach, throttle]);

  const applyPreset = (alt: number, m: number, thr: number) => {
    setAltitude(alt);
    setMach(m);
    setThrottle(thr);
    executeSimulation(alt, m, thr);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Counterfactual What-If Operational Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Explore alternative flight profiles and thrust settings to quantify aerothermal wear mitigation
              and Remaining Useful Life extension.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset(35.0, 0.74, 90.0)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition"
            >
              🌱 Derated Eco-Cruise
            </button>
            <button
              onClick={() => applyPreset(35.0, 0.82, 100.0)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
            >
              ✈ Standard Cruise
            </button>
            <button
              onClick={() => applyPreset(12.0, 0.84, 104.0)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/25 transition"
            >
              🔥 Hot & High Thrust
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-5 glass-panel rounded-xl p-5 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Operational Setting Controls
          </h3>

          {/* Altitude Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-mono">Flight Altitude (Setting 1)</span>
              <span className="text-cyan-400 font-mono font-bold">{altitude.toFixed(1)} kft</span>
            </div>
            <input
              type="range"
              min="0"
              max="42"
              step="1"
              value={altitude}
              onChange={(e) => setAltitude(parseFloat(e.target.value))}
              onMouseUp={() => executeSimulation(altitude, mach, throttle)}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 kft (Sea Level)</span>
              <span>42 kft (Max Ceiling)</span>
            </div>
          </div>

          {/* Mach Number Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-mono">Mach Number (Setting 2)</span>
              <span className="text-cyan-400 font-mono font-bold">M {mach.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.84"
              step="0.01"
              value={mach}
              onChange={(e) => setMach(parseFloat(e.target.value))}
              onMouseUp={() => executeSimulation(altitude, mach, throttle)}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>M 0.20 (Approach)</span>
              <span>M 0.84 (High-Speed Cruise)</span>
            </div>
          </div>

          {/* Throttle Resolver Angle (TRA) Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-mono">Throttle / Thrust (Setting 3)</span>
              <span className="text-cyan-400 font-mono font-bold">{throttle.toFixed(0)}% TRA</span>
            </div>
            <input
              type="range"
              min="60"
              max="105"
              step="1"
              value={throttle}
              onChange={(e) => setThrottle(parseFloat(e.target.value))}
              onMouseUp={() => executeSimulation(altitude, mach, throttle)}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>60% (Idle/Descent)</span>
              <span>100% (Takeoff / Climb)</span>
            </div>
          </div>

          {/* Recalculate Button */}
          <button
            onClick={() => executeSimulation(altitude, mach, throttle)}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs tracking-wider uppercase font-mono flex items-center justify-center gap-2 transition"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Counterfactual Simulation
          </button>
        </div>

        {/* Right Column: Prognostic Impacts & Projected Curves */}
        <div className="lg:col-span-7 glass-panel rounded-xl p-5 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Prognostic Life Impact
          </h3>

          {result ? (
            <div className="space-y-5">
              {/* Comparative Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-avionics-900 p-3 rounded-lg border border-avionics-border">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Baseline RUL</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {result.baseline_rul} <span className="text-xs font-normal text-slate-400">cyc</span>
                  </span>
                </div>

                <div className="bg-avionics-900 p-3 rounded-lg border border-avionics-border">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Counterfactual RUL</span>
                  <span className="text-2xl font-bold font-mono text-cyan-300">
                    {result.counterfactual_rul} <span className="text-xs font-normal text-slate-400">cyc</span>
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    result.rul_delta >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span className="text-[10px] font-mono block uppercase">Δ Life Extension</span>
                  <div className="flex items-center gap-1.5 text-2xl font-bold font-mono">
                    {result.rul_delta >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-rose-400" />
                    )}
                    <span>
                      {result.rul_delta >= 0 ? `+${result.rul_delta}` : result.rul_delta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stress Factor Callout */}
              <div className="p-3 bg-avionics-900/80 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Component Stress Multiplier:</span>
                <span className="text-slate-200 font-bold">
                  {result.stress_ratio}x ({result.pct_change > 0 ? `+${result.pct_change}% RUL` : `${result.pct_change}% RUL`})
                </span>
              </div>

              {/* Recommendation Note */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
                <strong className="text-white block mb-1">Prescriptive Operational Strategy:</strong>
                {result.recommendation}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-500">
              Calculating counterfactual physics surrogate...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
