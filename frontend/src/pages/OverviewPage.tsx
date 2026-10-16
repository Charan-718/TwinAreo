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
  CONTINUE: 'Continue routine telemetry monitoring',
  INSPECT: 'Schedule workshop borescope inspection',
  REMOVE: 'Plan immediate engine removal for overhaul',
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
        description={`Conservative RUL threshold evaluated at ${fmt.cyclesWord(
          decisionRul,
        )} (90% conformal lower bound; policy switches to 95% bound under twin discrepancy).`}
      />

      <StatStrip className="mb-6">
        <Stat
          size="lg"
          label="Predicted RUL"
          value={fmt.cycles(engine.rul_pred)}
          unit="CYCLES"
          hint={`90% Interval: ${fmt.range(
            engine.intervals['0.9'].lower,
            engine.intervals['0.9'].upper,
          )}`}
        />
        <Stat
          label="Health Index"
          value={fmt.pct(engine.health_pct, 0)}
          hint="Calculated from predicted RUL curve"
        />
        <Stat
          label="Fault Hypothesis"
          value={
            engine.fault_mode === 'NO_CLEAR_SIGNATURE'
              ? 'Unclear'
              : engine.fault_mode === 'HPC_DEGRADATION'
              ? 'HPC'
              : 'Fan'
          }
          hint={
            engine.fault_mode === 'NO_CLEAR_SIGNATURE'
              ? 'Signature delta < 35% EOL'
              : `Separation: ${fmt.num(engine.fault_confidence)}`
          }
        />
        <Stat
          label="Twin Discrepancy"
          value={drift.drift_score == null ? '–' : fmt.num(drift.drift_score)}
          hint={
            drift.drift_score == null
              ? 'Insufficient cycles observed'
              : `Threshold: ${fmt.num(drift.threshold)}`
          }
        />
      </StatStrip>

      <Panel
        title="Remaining useful life trajectory"
        description="Observed cycle estimates against 90% conformal prediction interval and automated dispatch thresholds."
        actions={
          <a
            href={href({ kind: 'engine', engineId: engine.engine_id, page: 'prognosis' })}
            className="text-xs font-mono font-bold text-primary hover:underline uppercase"
          >
            [ OPEN_PROGNOSIS &gt;&gt; ]
          </a>
        }
        className="mb-6"
      >
        <RulTrajectory history={engine.telemetry_history} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recommendation reasoning trace"
          actions={
            <a
              href={href({ kind: 'engine', engineId: engine.engine_id, page: 'advisor' })}
              className="text-xs font-mono font-bold text-primary hover:underline uppercase"
            >
              [ OPEN_ADVISOR &gt;&gt; ]
            </a>
          }
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3.5 text-xs font-mono m-0">
            <dt className="text-primary/70 font-semibold uppercase">{"//"} DECISION_BOUND</dt>
            <dd className="m-0 tabular font-bold text-primary">
              {fmt.cyclesWord(decisionRul)} ({level === '0.95' ? '95%' : '90%'} lower bound)
            </dd>
            <dt className="text-primary/70 font-semibold uppercase">{"//"} POINT_ESTIMATE</dt>
            <dd className="m-0 tabular text-fg">{fmt.cyclesWord(engine.rul_pred)}</dd>
            <dt className="text-primary/70 font-semibold uppercase">{"//"} THRESHOLDS</dt>
            <dd className="m-0 text-fg-secondary">Inspect ≤ 50 cycles {"//"} Remove ≤ 20 cycles</dd>
            <dt className="text-primary/70 font-semibold uppercase">{"//"} HEALTH_CHECK</dt>
            <dd className="m-0 text-fg-secondary">
              {engine.anomaly.alarm ? (
                <span className="text-danger font-bold">[ ALARM_ACTIVE ]</span>
              ) : (
                <span className="text-success font-bold">[ NOMINAL ]</span>
              )}{' '}
              (Distance: {fmt.num(engine.anomaly.score, 1)} / Threshold: {fmt.num(engine.anomaly.threshold, 1)})
            </dd>
            <dt className="text-primary/70 font-semibold uppercase">{"//"} CALIBRATION</dt>
            <dd className="m-0 text-fg-secondary">
              {drift.drift_detected
                ? 'Discrepancy detected: Decided on 95% conservative bound'
                : 'Within calibration: 90% conservative bound applied'}
            </dd>
          </dl>
        </Panel>

        <Panel
          title="Highest sensor deviations"
          description="Normalized sensor shift (in σ) compared to early-life healthy baseline."
          actions={
            <a
              href={href({ kind: 'engine', engineId: engine.engine_id, page: 'twin' })}
              className="text-xs font-mono font-bold text-primary hover:underline uppercase"
            >
              [ ALL_CHANNELS &gt;&gt; ]
            </a>
          }
        >
          <ul className="list-none p-0 m-0 divide-y divide-line-subtle font-mono text-xs">
            {shifts.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="min-w-0 truncate">
                  <span className="font-bold text-fg">{channelLabel(s.key)}</span>
                  <span className="text-fg-muted">
                    {' '}
                    · {s.name}, {lowerFirst(s.description)}
                  </span>
                </span>
                <span
                  className={`tabular font-bold shrink-0 ${
                    Math.abs(s.shift_sigma!) > 2
                      ? 'text-warning drop-shadow-[0_0_6px_rgba(255,184,0,0.4)]'
                      : 'text-primary'
                  }`}
                >
                  {fmt.signed(s.shift_sigma!, 2)}σ
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
};
