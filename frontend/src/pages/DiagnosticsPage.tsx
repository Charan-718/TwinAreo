import React from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { channelLabel } from '../components/engine/sensors';
import { LineChart } from '../components/charts/LineChart';
import { Panel } from '../components/ui/Panel';
import { Stat, StatStrip } from '../components/ui/Stat';
import { Tag } from '../components/ui/StatusTag';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { EngineDetail } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const Meter: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 font-mono">
        <span className="text-fg-secondary uppercase tracking-wider font-semibold">
          <span className="text-primary/70 mr-1">{"//"}</span>{label}
        </span>
        <span className="tabular text-primary font-bold">{value.toFixed(2)}</span>
      </div>
      <div
        className="h-2.5 bg-surface-sunken p-0.5 border border-line-subtle relative overflow-hidden"
        style={{ clipPath: 'var(--clip-badge)' }}
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full bg-primary transition-[width] duration-slow"
          style={{
            width: `${pct}%`,
            clipPath: 'var(--clip-badge)',
            boxShadow: '0 0 10px rgba(0, 255, 157, 0.6)',
          }}
        />
      </div>
    </div>
  );
};

export const DiagnosticsPage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const exp = useAsync(() => api.experiments(), []);
  const fm = exp.data?.fault_modes;
  const an = exp.data?.anomaly;
  const unclear = engine.fault_mode === 'NO_CLEAR_SIGNATURE';
  const meterMax = Math.max(1.2, engine.hpc_score, engine.fan_score);

  return (
    <>
      <EngineHeader
        engine={engine}
        title="Diagnostics"
        description="Two questions: is this engine still behaving like a healthy one, and if not, which degradation mode does its sensor pattern resemble?"
      />

      <StatStrip className="mb-6">
        <Stat label="Fault hypothesis" value={unclear ? 'Not yet attributable' : engine.fault_mode === 'HPC_DEGRADATION' ? 'HPC degradation' : 'Fan degradation'}
          hint={unclear ? 'Shift below 35% of a typical end-of-life signature' : `Separation ${fmt.num(engine.fault_confidence)} (0 = ambiguous, 1 = clear)`} />
        <Stat label="Signature progress" value={fmt.pct(engine.signature_progress * 100, 0)} hint="Shift relative to a typical end-of-life signature" />
        <Stat label="Healthy-state distance" value={fmt.num(engine.anomaly.score, 1)} hint={`Alarm threshold ${fmt.num(engine.anomaly.threshold, 1)}`} />
        <Stat label="First persistent alarm" value={engine.anomaly.first_alarm_cycle ?? 'None'} hint="Three consecutive exceedances" />
      </StatStrip>

      <Panel
        title="Distance from healthy behavior"
        description="Mahalanobis distance between the engine's smoothed, regime-normalized sensors and the distribution seen in early life across the training fleet. The threshold is the 99th percentile on held-out healthy cycles."
        className="mb-6"
      >
        <LineChart
          x={engine.telemetry_history.map((h) => h.cycle)}
          series={[{ id: 'a', label: 'Healthy-state distance', color: 'var(--chart-1)', values: engine.telemetry_history.map((h) => h.anomaly_score) }]}
          refLines={[{ y: engine.anomaly.threshold, label: 'Alarm threshold' }]}
          xLabel="Cycle"
          formatY={(v) => v.toFixed(0)}
          height={240}
          ariaLabel={`Anomaly distance over time, latest ${engine.anomaly.score.toFixed(1)} against threshold ${engine.anomaly.threshold.toFixed(1)}`}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Panel title="Fault-mode similarity" description="How closely the engine's shift pattern matches each FD004 degradation mode, scaled by how far it has progressed.">
          <div className="space-y-5">
            <Meter label="High-pressure compressor (HPC)" value={engine.hpc_score} max={meterMax} />
            <Meter label="Fan" value={engine.fan_score} max={meterMax} />
          </div>
          <p className="text-sm text-fg-muted mt-5">
            {unclear
              ? 'Both similarities are low because the engine has not shifted far from its starting point. The hypothesis firms up as degradation progresses.'
              : 'The larger bar is the current hypothesis. FD004 publishes no per-engine fault labels, so treat it as a hypothesis, not a confirmed diagnosis.'}
          </p>
        </Panel>

        <Panel title="Channels that moved most" description="Shift since the first 15 observed cycles, above one standard deviation.">
          {engine.active_anomalies.length === 0 ? (
            <p className="text-sm text-fg-muted">No channel has shifted by more than one standard deviation.</p>
          ) : (
            <ul className="list-none p-0 m-0 divide-y divide-line-subtle font-mono">
              {engine.active_anomalies.map((a) => (
                <li key={a.component} className="py-2.5 flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="text-sm font-semibold block text-fg">
                      <span className="text-primary/70 mr-1.5">{"//"}</span>{channelLabel(a.component)}
                    </span>
                    <span className="text-xs text-fg-muted font-mono">{a.description}</span>
                  </span>
                  <Tag tone={a.severity === 'HIGH' ? 'danger' : 'warning'}>{a.severity === 'HIGH' ? 'CRIT_SHIFT' : 'MOD_SHIFT'}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="How these diagnostics were validated">
        <div className="prose-body text-sm">
          <p>
            Fault modes are learned without labels: each FD004 training engine's early-to-late sensor shift is clustered into
            two groups. FD002 shares FD004's six operating conditions but only has HPC degradation, so the cluster its engines
            fall into is labeled HPC.
            {fm && <> In this run, <strong className="text-fg">{fmt.pct(fm.fd002_assigned_to_hpc_pct, 0)}</strong> of {fm.fd002_engines} FD002 engines
              and <strong className="text-fg">{fmt.pct(fm.fd001_check.hpc_pct, 0)}</strong> of FD001 engines (also HPC only) landed in the HPC cluster;
              cluster silhouette {fmt.num(fm.silhouette)}.</>}
          </p>
          {an && (
            <p>
              The anomaly detector separates healthy cycles (true RUL above 125) from late-life cycles (true RUL 30 or less)
              on {an.evaluation_engines} held-out engines with AUROC {fmt.num(an.auroc, 3)}, raising a persistent alarm on{' '}
              {fmt.pct(an.detection_rate_pct, 0)} of them a median {an.median_lead_time_cycles ?? '–'} cycles before failure.
            </p>
          )}
        </div>
      </Panel>
    </>
  );
};
