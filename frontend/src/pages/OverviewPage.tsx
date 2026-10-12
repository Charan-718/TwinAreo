import React from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { RulTrajectory } from '../components/engine/RulTrajectory';
import { channelLabel, lowerFirst } from '../components/engine/sensors';
import { Panel } from '../components/ui/Panel';
import { Stat, StatStrip } from '../components/ui/Stat';
import { fmt } from '../lib/format';
import { href } from '../lib/router';
import { ActionCode, EngineDetail } from '../lib/types';

const HEADLINE: Record<ActionCode, string> = {
  CONTINUE: 'Continue routine monitoring',
  INSPECT: 'Schedule an inspection',
  REMOVE: 'Plan removal for a shop visit',
};

export const OverviewPage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const drift = engine.drift_status;
  const level = drift.drift_detected ? '0.95' : '0.9';
  const decisionRul = engine.intervals[level].lower;
  const shifts = engine.latest_sensors
    .filter((s) => s.informative && s.shift_sigma != null)
    .sort((a, b) => Math.abs(b.shift_sigma!) - Math.abs(a.shift_sigma!))
    .slice(0, 5);

  return (
    <>
      <EngineHeader
        engine={engine}
        title={HEADLINE[engine.action_code]}
        description={`Based on a conservative remaining-life bound of ${fmt.cyclesWord(decisionRul)} (the lower end of the ${level === '0.95' ? '95' : '90'}% interval).`}
      />

      <StatStrip className="mb-6">
        <Stat size="lg" label="Predicted RUL" value={fmt.cycles(engine.rul_pred)} unit="cycles"
          hint={`90% interval ${fmt.range(engine.intervals['0.9'].lower, engine.intervals['0.9'].upper)}`} />
        <Stat label="Health index" value={fmt.pct(engine.health_pct, 0)} hint="Derived from predicted RUL" />
        <Stat label="Fault hypothesis" value={engine.fault_mode === 'NO_CLEAR_SIGNATURE' ? 'Unclear' : engine.fault_mode === 'HPC_DEGRADATION' ? 'HPC' : 'Fan'}
          hint={engine.fault_mode === 'NO_CLEAR_SIGNATURE' ? 'Signature still too small' : `Separation ${fmt.num(engine.fault_confidence)}`} />
        <Stat label="Twin discrepancy" value={drift.drift_score == null ? '–' : fmt.num(drift.drift_score)}
          hint={drift.drift_score == null ? 'Not enough cycles yet' : `Threshold ${fmt.num(drift.threshold)}`} />
      </StatStrip>

      <Panel
        title="Remaining useful life over time"
        description="Each point is the model's estimate given the cycles observed so far. The shaded band is the 90% conformal interval; the dashed lines are where the policy recommends inspection and removal."
        actions={<a href={href({ kind: 'engine', engineId: engine.engine_id, page: 'prognosis' })} className="text-sm">Open prognosis</a>}
        className="mb-6"
      >
        <RulTrajectory history={engine.telemetry_history} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Why this recommendation"
          actions={<a href={href({ kind: 'engine', engineId: engine.engine_id, page: 'advisor' })} className="text-sm">Open advisor</a>}
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm m-0">
            <dt className="text-fg-muted">Decision bound</dt>
            <dd className="m-0 tabular">{fmt.cyclesWord(decisionRul)} ({level === '0.95' ? '95' : '90'}% lower bound)</dd>
            <dt className="text-fg-muted">Point estimate</dt>
            <dd className="m-0 tabular">{fmt.cyclesWord(engine.rul_pred)}</dd>
            <dt className="text-fg-muted">Thresholds</dt>
            <dd className="m-0">Inspect at 50, remove at 20 cycles</dd>
            <dt className="text-fg-muted">Healthy-state check</dt>
            <dd className="m-0">
              {engine.anomaly.alarm ? 'Alarm active' : 'No alarm'} (distance {fmt.num(engine.anomaly.score, 1)}, threshold {fmt.num(engine.anomaly.threshold, 1)})
            </dd>
            <dt className="text-fg-muted">Calibration</dt>
            <dd className="m-0">
              {drift.drift_detected ? 'Discrepancy above threshold, decided on the 95% bound' : 'Within reference; 90% bound used'}
            </dd>
          </dl>
        </Panel>

        <Panel
          title="Largest sensor shifts"
          description="Since the first 15 cycles, in normalized σ."
          actions={<a href={href({ kind: 'engine', engineId: engine.engine_id, page: 'twin' })} className="text-sm">All channels</a>}
        >
          <ul className="list-none p-0 m-0 divide-y divide-line-subtle">
            {shifts.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{channelLabel(s.key)}</span>
                  <span className="text-fg-muted"> · {s.name}, {lowerFirst(s.description)}</span>
                </span>
                <span className="tabular font-mono shrink-0">{fmt.signed(s.shift_sigma!, 2)}σ</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
};
