import React from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { Panel } from '../components/ui/Panel';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { Stat, StatStrip } from '../components/ui/Stat';
import { ActionTag } from '../components/ui/StatusTag';
import { api } from '../lib/api';
import { ACTION_LABEL, fmt } from '../lib/format';
import { EngineDetail } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const AGENT_ROLE: Record<string, string> = {
  Observer: 'Reads the latest cycles and the healthy-state check',
  Diagnosis: 'Attributes the sensor pattern to a fault mode',
  Prognosis: 'Reports remaining life and its intervals',
  Calibration: 'Decides which interval the decision may rely on',
  Scenario: 'Tests a throttle derate on the surrogate',
  Planner: 'Applies the maintenance policy',
};

export const AdvisorPage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const { data: a, error, loading, reload } = useAsync(() => api.advisor(engine.engine_id), [engine.engine_id]);

  return (
    <>
      <EngineHeader
        engine={engine}
        title="Maintenance advisor"
        description="A fixed sequence of specialized agents turns the twin's state into a recommendation. Each step is recorded, so the reasoning can be checked line by line."
      />

      {error ? (
        <ErrorState title="Could not produce an assessment" error={error} onRetry={reload} />
      ) : loading || !a ? (
        <div className="space-y-6" role="status" aria-label="Preparing assessment">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <StatStrip className="mb-6">
            <Stat label="Recommendation" value={<ActionTag action={a.action_code} />} hint={a.recommended_action} />
            <Stat label="Decision bound" value={fmt.cycles(a.decision_basis.decision_rul)} unit="cycles"
              hint={`Lower end of the ${Math.round(a.decision_basis.confidence_level * 100)}% interval`} />
            <Stat label="Point estimate alone" value={fmt.cycles(a.decision_basis.point_estimate)} unit="cycles"
              hint={`Would suggest: ${ACTION_LABEL[a.decision_basis.point_estimate_action].toLowerCase()}`} />
          </StatStrip>

          <div className="grid gap-6 lg:grid-cols-5">
            <Panel className="lg:col-span-3" title="Reasoning trace" description={`Assessment at cycle ${a.timestamp_cycle}.`}>
              <ol className="list-none p-0 m-0">
                {a.trace.map((step, i) => (
                  <li key={step.agent} className="grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0 relative">
                    <span className="w-7 h-7 clip-badge border border-primary bg-surface-elevated text-xs font-mono font-bold text-primary flex items-center justify-center tabular z-[1] shadow-[0_0_8px_rgba(0,255,157,0.3)]">
                      {i + 1}
                    </span>
                    {i < a.trace.length - 1 && <span className="absolute left-[0.85rem] top-7 bottom-0 w-px bg-line" aria-hidden="true" />}
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold">{step.agent}</p>
                      <p className="text-xs text-fg-muted">{AGENT_ROLE[step.agent]}</p>
                      <p className="text-sm text-fg-secondary mt-1.5">{step.finding}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>

            <div className="lg:col-span-2 space-y-6">
              <Panel title="Plan">
                <p className="text-sm">{a.plan}</p>
              </Panel>
              <Panel title="Policy">
                <dl className="text-sm m-0 space-y-3">
                  <div><dt className="text-fg-muted">Plan removal when the bound is at or below</dt><dd className="m-0 tabular">{a.decision_basis.thresholds.remove_at} cycles</dd></div>
                  <div><dt className="text-fg-muted">Inspect when the bound is at or below</dt><dd className="m-0 tabular">{a.decision_basis.thresholds.inspect_at} cycles</dd></div>
                  <div><dt className="text-fg-muted">Bound used</dt><dd className="m-0">90% lower bound, or 95% under twin discrepancy</dd></div>
                </dl>
                <p className="text-xs text-fg-muted mt-4">{a.disclaimer}</p>
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
};
