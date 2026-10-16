import React, { useState } from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { RulTrajectory } from '../components/engine/RulTrajectory';
import { Panel } from '../components/ui/Panel';
import { Segmented } from '../components/ui/Segmented';
import { Stat, StatStrip } from '../components/ui/Stat';
import { Skeleton } from '../components/ui/Feedback';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { EngineDetail, LevelKey } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const LEVELS: Array<{ value: LevelKey; label: string }> = [
  { value: '0.8', label: '80%' },
  { value: '0.9', label: '90%' },
  { value: '0.95', label: '95%' },
];

const METHODS = [
  { key: 'split', name: 'Split conformal', note: 'Constant width from absolute residuals' },
  { key: 'cqr', name: 'Conformalized quantile regression', note: 'Width adapts to each engine' },
  { key: 'cqr_fleet_adapted', name: 'CQR, adapted to the fleet', note: 'Reweighted for the fleet’s life-stage mix (served)' },
] as const;

export const PrognosisPage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const [level, setLevel] = useState<LevelKey>('0.9');
  const bench = useAsync(() => api.benchmark(), []);
  const iv = engine.intervals[level];
  const pct = Math.round(Number(level) * 100);

  return (
    <>
      <EngineHeader
        engine={engine}
        title="Prognosis"
        description="Remaining useful life with a calibrated interval instead of a single number. The interval is what the maintenance decision uses."
        actions={<Segmented<LevelKey> label="Confidence level" value={level} onChange={setLevel} options={LEVELS} size="md" />}
      />

      <StatStrip className="mb-6">
        <Stat size="lg" label="Predicted RUL" value={fmt.cycles(engine.rul_pred)} unit="cycles" hint="Gradient-boosted model, FD004" />
        <Stat label={`${pct}% interval`} value={fmt.range(iv.lower, iv.upper)} unit="cycles" hint={`Width ${fmt.cycles(iv.upper - iv.lower)} cycles`} />
        <Stat label="Conservative bound" value={fmt.cycles(iv.lower)} unit="cycles" hint={`Lower end of the ${pct}% interval`} />
        <Stat label="Cycles observed" value={engine.total_cycles_observed} hint="Trajectory ends before failure" />
      </StatStrip>

      <Panel
        title="Estimate and interval by cycle"
        description="The estimate is capped at 125 cycles: early in life, degradation is not yet visible in the sensors and the model is trained on a capped target, as is standard for C-MAPSS."
        className="mb-6"
      >
        <RulTrajectory history={engine.telemetry_history} height={320} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          padded={false}
          title={`How well ${pct}% intervals hold on the test fleet`}
          description="Share of the 248 FD004 test engines whose true remaining life fell inside the interval, at the last observed cycle. A well-calibrated method lands close to the target."
        >
          {bench.loading ? (
            <div className="p-5 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" /></div>
          ) : bench.error || !bench.data?.intervals ? (
            <p className="p-5 text-sm text-fg-muted">Benchmark results are unavailable. Run <code>python3 ml/train_and_evaluate.py</code>.</p>
          ) : (
            <div className="overflow-x-auto mt-4 border-t border-line">
              <table className="w-full min-w-[32rem] text-sm font-mono">
                <thead className="bg-surface-sunken text-left">
                  <tr>
                    <th scope="col" className="label font-medium h-10 px-4">{"//"} METHOD</th>
                    <th scope="col" className="label font-medium h-10 px-4 text-right">{"//"} COVERAGE</th>
                    <th scope="col" className="label font-medium h-10 px-4 text-right">{"//"} MEAN_WIDTH</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODS.map((m) => {
                    const r = bench.data!.intervals[m.key][level];
                    const served = m.key === 'cqr_fleet_adapted';
                    return (
                      <tr key={m.key} className="border-t border-line-subtle hover:bg-surface-interactive/40 transition-colors">
                        <th scope="row" className="px-4 py-2.5 text-left font-normal">
                          <span className={served ? 'font-semibold text-primary' : 'text-fg'}>{served ? `[SERVED] ${m.name}` : m.name}</span>
                          <span className="block text-xs text-fg-muted font-mono">{m.note}</span>
                        </th>
                        <td className="px-4 text-right tabular">
                          <span className="text-fg font-semibold">{fmt.pct(r.empirical_coverage_pct)}</span>
                          <span className="block text-xs text-fg-muted font-mono">[TARGET {pct}%]</span>
                        </td>
                        <td className="px-4 text-right tabular text-fg-secondary font-mono">{fmt.num(r.mpiw_cycles, 1)} cycles</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="lg:col-span-2" title="Reading the interval">
          <div className="prose-body text-sm">
            <p>
              Intervals are calibrated on engines the model never trained on (five-fold cross-conformal). Under exchangeable
              data, a {pct}% interval contains the true remaining life for about {pct}% of engines.
            </p>
            <p>
              The test fleet stops mid-life more often than the training engines, so plain intervals cover slightly less than
              promised. The served intervals are reweighted for that life-stage mix using unlabeled predictions only.
            </p>
            <p>
              Benchmark scoring uses the asymmetric NASA function, which penalizes late predictions (overestimating life)
              more than early ones: <code>exp(d/10) − 1</code> for late, <code>exp(−d/13) − 1</code> for early.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
};
