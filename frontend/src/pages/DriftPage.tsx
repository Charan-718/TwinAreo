import React, { useState } from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { channelLabel } from '../components/engine/sensors';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Feedback';
import { Icon } from '../components/ui/Icon';
import { Panel } from '../components/ui/Panel';
import { Stat, StatStrip } from '../components/ui/Stat';
import { Tag } from '../components/ui/StatusTag';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { EngineDetail } from '../lib/types';
import { useAsync } from '../lib/useAsync';

export const DriftPage: React.FC<{ engine: EngineDetail; onRecalibrated: () => void }> = ({ engine, onRecalibrated }) => {
  const d = engine.drift_status;
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const exp = useAsync(() => api.experiments(), []);
  const transfer = exp.data?.transfer;

  const runCheck = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await api.recalibrate(engine.engine_id);
      setResult({ tone: r.calibrated ? 'success' : 'warning', text: r.message });
      onRecalibrated();
    } catch (e) {
      setResult({ tone: 'warning', text: e instanceof Error ? e.message : 'Calibration check failed.' });
    } finally {
      setRunning(false);
    }
  };

  const maxKs = Math.max(d.threshold * 1.4, ...d.channels.map((c) => c.ks_stat), 0.01);

  return (
    <>
      <EngineHeader
        engine={engine}
        title="Drift & calibration"
        description="Does this engine still look like the engines the twin learned from, at the same stage of life? When it does not, the twin's estimates are less trustworthy and decisions become more conservative."
        actions={<Button variant="primary" onClick={runCheck} loading={running}>{!running && <Icon name="refresh" size={16} />}Run calibration check</Button>}
      />

      {result && <div className="mb-6"><Notice tone={result.tone} onDismiss={() => setResult(null)}>{result.text}</Notice></div>}

      <StatStrip className="mb-6">
        <Stat label="Status" value={d.status === 'DRIFT_DETECTED' ? 'Discrepancy' : d.status === 'INSUFFICIENT_DATA' ? 'Too few cycles' : 'Within reference'}
          hint={d.drift_detected ? 'Decisions use the 95% interval' : 'Decisions use the 90% interval'} />
        <Stat label="Discrepancy score" value={d.drift_score == null ? '–' : fmt.num(d.drift_score, 3)} hint="Mean KS statistic over 10 channels" />
        <Stat label="Threshold" value={fmt.num(d.threshold, 3)} hint="95th percentile on held-out engines" />
        <Stat label="Smallest adjusted p" value={d.p_value == null ? '–' : d.p_value < 0.0001 ? '< 0.0001' : fmt.num(d.p_value, 4)} hint="Bonferroni across channels" />
      </StatStrip>

      <Panel
        padded={false}
        title="Channel comparison"
        description={`Last ${d.window_cycles} cycles of this engine against training cycles with a similar remaining life (within ±10 cycles of the current estimate).`}
        className="mb-6"
      >
        <div className="overflow-x-auto mt-4 border-t border-line">
          <table className="w-full min-w-[40rem] text-sm font-mono">
            <thead className="bg-surface-sunken text-left">
              <tr>
                <th scope="col" className="label font-medium h-10 px-4">{"//"} CHANNEL</th>
                <th scope="col" className="label font-medium h-10 px-4 w-[40%]">{"//"} KS_STATISTIC</th>
                <th scope="col" className="label font-medium h-10 px-4 text-right">{"//"} WASSERSTEIN</th>
                <th scope="col" className="label font-medium h-10 px-4 text-right">{"//"} ADJUSTED_P</th>
                <th scope="col" className="label font-medium h-10 px-4">{"//"} STATE</th>
              </tr>
            </thead>
            <tbody>
              {d.channels.map((c) => {
                const over = c.ks_stat > d.threshold && c.p_value_adjusted < 0.05;
                return (
                  <tr key={c.sensor} className="border-t border-line-subtle hover:bg-surface-interactive/40 transition-colors">
                    <th scope="row" className="h-11 px-4 text-left font-medium text-fg">
                      <span className="text-primary/70 mr-1">{"//"}</span>{channelLabel(c.sensor)}
                    </th>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative flex-1 h-2.5 bg-surface-sunken border border-line-subtle p-0.5"
                          style={{ clipPath: 'var(--clip-badge)' }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, (c.ks_stat / maxKs) * 100)}%`,
                              clipPath: 'var(--clip-badge)',
                              backgroundColor: over ? 'var(--color-danger)' : 'var(--color-primary)',
                              boxShadow: over ? '0 0 8px rgba(255, 0, 85, 0.7)' : '0 0 6px rgba(0, 255, 157, 0.5)',
                            }}
                          />
                          <div
                            className="absolute -top-1 -bottom-1 w-0.5 bg-accent z-10 shadow-[0_0_4px_var(--color-accent)]"
                            style={{ left: `${(d.threshold / maxKs) * 100}%` }}
                            aria-hidden="true"
                            title={`Threshold: ${d.threshold.toFixed(3)}`}
                          />
                        </div>
                        <span className="font-mono tabular w-12 text-right text-xs text-fg-secondary font-semibold">{c.ks_stat.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-4 text-right font-mono tabular text-fg-secondary">{c.wasserstein_dist.toFixed(3)}</td>
                    <td className="px-4 text-right font-mono tabular text-fg-secondary">{c.p_value_adjusted < 0.0001 ? '<0.0001' : c.p_value_adjusted.toFixed(4)}</td>
                    <td className="px-4">{over ? <Tag tone="danger">DRIFT_ALERT</Tag> : <Tag tone="neutral">NOMINAL</Tag>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 md:px-5 py-3 text-xs text-fg-muted border-t border-line-subtle font-mono">
          <span className="text-accent font-bold mr-1">{"//"} NOTE:</span> The vertical tick on each gauge marks the alarm threshold.
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Self-calibration policy">
          <div className="prose-body text-sm">
            <p>
              Without labels: the served intervals are reweighted for the deployed fleet's life-stage mix, and an engine whose
              discrepancy exceeds the threshold is decided on its 95% bound instead of the 90% bound.
            </p>
            <p>
              With new failures: once run-to-failure data arrives from the new fleet, the conformal corrections are refit, and
              optionally the model. These steps are evaluated offline on the transfer experiment below.
            </p>
          </div>
          {engine.calibration_log.length > 0 && (
            <div className="mt-5">
              <p className="label mb-2">{"//"} CHECKS_THIS_SESSION</p>
              <ul className="list-none p-0 m-0 divide-y divide-line-subtle text-xs font-mono">
                {engine.calibration_log.slice().reverse().map((l, i) => (
                  <li key={i} className="py-2 flex justify-between gap-4">
                    <span className={l.escalated ? 'text-danger font-semibold' : 'text-fg-secondary'}>
                      {l.escalated ? '[ESCALATED_95%]' : '[NOMINAL_BOUND]'}
                    </span>
                    <span className="font-mono tabular text-fg-muted">score {l.drift_score == null ? '–' : l.drift_score.toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Evidence: FD002 to FD004 transfer" description="A model trained on FD002 (HPC faults only) meets FD004, which adds fan degradation.">
          {!transfer ? (
            <p className="text-sm text-fg-muted">{exp.loading ? 'Loading experiment results…' : 'Experiment results are unavailable.'}</p>
          ) : (
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 text-sm m-0">
              <dt className="text-fg-secondary">Engines flagged, same domain (FD002)</dt>
              <dd className="m-0 tabular text-right">{fmt.pct(transfer.drift_detection.in_domain_flag_rate_pct)}</dd>
              <dt className="text-fg-secondary">Engines flagged, shifted domain (FD004)</dt>
              <dd className="m-0 tabular text-right">{fmt.pct(transfer.drift_detection.shifted_flag_rate_pct)}</dd>
              {transfer.drift_detection.shifted_by_fault_hypothesis?.FAN_DEGRADATION && (
                <>
                  <dt className="text-fg-secondary">Flagged among fan-degradation engines</dt>
                  <dd className="m-0 tabular text-right">{fmt.pct(transfer.drift_detection.shifted_by_fault_hypothesis.FAN_DEGRADATION.flag_rate_pct)}</dd>
                </>
              )}
              {transfer.variants.map((v) => (
                <React.Fragment key={v.variant}>
                  <dt className="text-fg-secondary">90% coverage: {v.variant.toLowerCase()}</dt>
                  <dd className="m-0 tabular text-right">{fmt.pct(v.empirical_coverage_pct_90)}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
        </Panel>
      </div>
    </>
  );
};
