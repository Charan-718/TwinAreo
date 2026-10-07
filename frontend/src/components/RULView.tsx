import React from 'react';
import { EngineDetail } from '../types';
import { RULIntervalCard } from './RULIntervalCard';
import { Clock, Calculator, FileCheck } from 'lucide-react';

interface RULViewProps {
  engine: EngineDetail;
}

export const RULView: React.FC<RULViewProps> = ({ engine }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Remaining Useful Life (RUL) Prognostics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Piecewise linear degradation modeling with NASA C-MAPSS asymmetric risk scoring function.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-avionics-900 px-3 py-1.5 rounded-lg border border-avionics-border text-xs font-mono">
            <span className="text-slate-400">Benchmark Model:</span>
            <span className="text-cyan-400 font-bold">Gradient Boosting Ensemble</span>
          </div>
        </div>
      </div>

      {/* Grid: RUL Card & NASA Scoring Function */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6">
          <RULIntervalCard
            rulPred={engine.rul_pred}
            rulLower={engine.rul_lower}
            rulUpper={engine.rul_upper}
            confidencePct={engine.confidence_pct}
            unitCode={engine.unit_code}
          />
        </div>

        {/* NASA Scoring Function Details */}
        <div className="md:col-span-6 glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>NASA C-MAPSS Asymmetric Evaluation Metric</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            In aerospace engine operations, an overestimation (predicting a component has more life remaining than it actually does)
            poses severe airworthiness risk. The NASA C-MAPSS scoring metric reflects this penalty asymmetry:
          </p>

          <div className="p-3 bg-avionics-900 rounded-lg border border-avionics-border font-mono text-xs text-slate-200 space-y-2">
            <div className="text-emerald-400">
              d &lt; 0 (Early Prediction): s = exp(-d / 13) - 1
            </div>
            <div className="text-rose-400">
              d &ge; 0 (Late Prediction): s = exp(d / 10) - 1
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-avionics-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">FD004 Fleet Test RMSE</span>
              <span className="text-lg font-bold text-cyan-300">18.80 cycles</span>
            </div>
            <div className="p-3 rounded-lg bg-avionics-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Mean NASA Score</span>
              <span className="text-lg font-bold text-white">10.75 / engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Piecewise Linear RUL Target Formulation */}
      <div className="glass-panel rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          Piecewise Linear Target Justification
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard C-MAPSS literature caps the early RUL target at <strong className="text-cyan-300 font-mono">RUL_max = 125 cycles</strong>.
          During initial operational cycles, engine degradation is negligible; healthy engines exhibit invariant nominal sensor values.
          Clipping the target prevents the model from attempting to learn arbitrary linear wear during early healthy flight stages.
        </p>
      </div>
    </div>
  );
};
