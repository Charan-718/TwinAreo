import React, { useState, useEffect } from 'react';
import { EngineDetail, AdvisorAssessment } from '../types';
import { fetchAdvisorAssessment } from '../api';
import { Bot, CheckCircle2, AlertTriangle, ShieldAlert, Wrench, GitCommit, FileText } from 'lucide-react';

interface AIAdvisorViewProps {
  engine: EngineDetail;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ engine }) => {
  const [assessment, setAssessment] = useState<AdvisorAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAdvisorAssessment(engine.engine_id)
      .then((data) => {
        if (mounted) setAssessment(data);
      })
      .catch((err) => console.error('Failed to fetch advisor assessment:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [engine.engine_id]);

  if (loading || !assessment) {
    return (
      <div className="glass-panel rounded-xl p-8 flex items-center justify-center text-slate-400 font-mono text-xs">
        <Bot className="w-5 h-5 mr-2 animate-bounce text-cyan-400" />
        Agentic reasoning layer evaluating engine aerothermal telemetry...
      </div>
    );
  }

  const isCritical = assessment.airworthiness_risk === 'CRITICAL';
  const isModerate = assessment.airworthiness_risk === 'MODERATE';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                TwinAero Agentic Airworthiness Advisor
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  MSG-3 DECISION SUPPORT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated multi-step reasoning orchestrating telemetry observation, fault hypothesis,
                conformal uncertainty bounds, and prescriptive maintenance action planning.
              </p>
            </div>
          </div>

          {/* Airworthiness Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold ${
              isCritical
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : isModerate
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-4 h-4" />
            ) : isModerate ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{assessment.dispatch_status}</span>
          </div>
        </div>
      </div>

      {/* Structured Reasoning Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase 1: Observation & Diagnosis */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            <span>Phase 1: Telemetry Observation & Diagnostics</span>
          </div>

          <div className="p-3 bg-avionics-900 rounded-lg border border-avionics-border space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Diagnostic Hypothesis</span>
            <p className="text-xs text-slate-200 leading-relaxed">{assessment.diagnostic_summary}</p>
          </div>

          <div className="p-3 bg-avionics-900 rounded-lg border border-avionics-border space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Identified Root Cause</span>
            <p className="text-xs font-semibold text-cyan-300">{assessment.root_cause}</p>
          </div>

          {/* Observations */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Raw Telemetry Findings</span>
            {assessment.observations.map((obs, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/40 p-2 rounded">
                <span className="text-cyan-400 font-mono">•</span>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2: Prescriptive Action Plan */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Phase 2: Prescriptive Maintenance Actions</span>
          </div>

          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">Action Directive</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-200">
                {assessment.action_code}
              </span>
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed">
              {assessment.recommended_action}
            </p>
          </div>

          {/* Prognostics Assessment Card */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-avionics-900 p-3 rounded-lg border border-avionics-border">
              <span className="text-slate-400 text-[10px] block uppercase">90% RUL Window</span>
              <span className="text-sm font-bold text-slate-200">
                {assessment.rul_assessment.confidence_interval_90}
              </span>
            </div>

            <div className="bg-avionics-900 p-3 rounded-lg border border-avionics-border">
              <span className="text-slate-400 text-[10px] block uppercase">Safe Flight Legs</span>
              <span className="text-sm font-bold text-emerald-400">
                {assessment.rul_assessment.safe_dispatch_limit} cycles max
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
            <strong>Self-Calibration Audit:</strong> {assessment.calibration_note}
          </div>
        </div>
      </div>

      {/* Decision Tree Trail */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Agentic Reasoning Chain Trace
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {assessment.decision_tree_path.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="px-3 py-1.5 rounded-lg bg-avionics-900 border border-slate-700 text-xs font-mono text-slate-300">
                <span className="text-cyan-400 mr-1.5 font-bold">#{idx + 1}</span>
                {step}
              </div>
              {idx < assessment.decision_tree_path.length - 1 && (
                <span className="text-slate-600 font-mono">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
