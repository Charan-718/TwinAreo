import React, { useEffect, useState } from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { LineChart } from '../components/charts/LineChart';
import { Button } from '../components/ui/Button';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { Panel } from '../components/ui/Panel';
import { RangeField } from '../components/ui/RangeField';
import { Stat, StatStrip } from '../components/ui/Stat';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { CounterfactualResponse, EngineDetail, OperatingSettings } from '../lib/types';

export const ScenariosPage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const current = engine.current_settings;
  const [params, setParams] = useState<OperatingSettings>(current);
  const [result, setResult] = useState<CounterfactualResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Debounced so dragging a slider sends one request when it settles.
  useEffect(() => {
    let cancelled = false;
    setPending(true);
    const t = window.setTimeout(() => {
      api.counterfactual(engine.engine_id, params)
        .then((r) => { if (!cancelled) { setResult(r); setError(null); } })
        .catch((e) => { if (!cancelled) setError(e); })
        .finally(() => { if (!cancelled) setPending(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [engine.engine_id, params, attempt]);

  const set = (k: keyof OperatingSettings) => (v: number) => setParams((p) => ({ ...p, [k]: v }));
  const presets: Array<{ label: string; value: OperatingSettings }> = [
    { label: 'Current profile', value: current },
    { label: 'Throttle −10', value: { ...current, throttle_pct: Math.max(60, current.throttle_pct - 10) } },
    { label: 'Partial throttle (60)', value: { ...current, throttle_pct: 60 } },
    { label: 'Cruise below 30 kft', value: { ...current, altitude_kft: Math.min(current.altitude_kft, 25) } },
  ];
  const same = (a: OperatingSettings, b: OperatingSettings) =>
    a.altitude_kft === b.altitude_kft && a.mach_number === b.mach_number && a.throttle_pct === b.throttle_pct;
  // Hide presets that would not change anything for this engine.
  const shownPresets = presets.filter((p, i) => i === 0 || !same(p.value, current));

  return (
    <>
      <EngineHeader
        engine={engine}
        title="What-if scenarios"
        description="Explore how a different operating profile might change remaining life. This is an assumption-based surrogate, so use it to compare directions rather than to predict exact cycles."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Operating profile" description="Starts at the engine's latest operating condition.">
          <div role="group" aria-label="Presets" className="flex flex-wrap gap-2 mb-6">
            {shownPresets.map((p) => (
              <Button key={p.label} size="sm" variant={same(params, p.value) ? 'primary' : 'secondary'}
                aria-pressed={same(params, p.value)} onClick={() => setParams(p.value)}>
                {p.label}
              </Button>
            ))}
          </div>
          <div className="space-y-6">
            <RangeField label="Altitude" value={params.altitude_kft} min={0} max={42} step={1}
              format={(v) => `${v.toFixed(0)} kft`} onChange={set('altitude_kft')}
              marker={{ value: current.altitude_kft, label: 'Now' }} />
            <RangeField label="Mach number" value={params.mach_number} min={0} max={0.84} step={0.01}
              format={(v) => v.toFixed(2)} onChange={set('mach_number')}
              marker={{ value: current.mach_number, label: 'Now' }} />
            <RangeField label="Throttle resolver angle" value={params.throttle_pct} min={60} max={100} step={1}
              format={(v) => `${v.toFixed(0)}`} onChange={set('throttle_pct')}
              description="C-MAPSS runs at TRA 60 or 100; values in between are interpolated by the surrogate."
              marker={{ value: current.throttle_pct, label: 'Now' }} />
          </div>
        </Panel>

        <div className="lg:col-span-3 space-y-6 min-w-0">
          {error ? (
            <ErrorState title="The scenario could not be evaluated" error={error} onRetry={() => setAttempt((a) => a + 1)} />
          ) : !result ? (
            <div className="bg-surface border border-line rounded-lg p-5 space-y-4" role="status" aria-label="Evaluating scenario">
              <Skeleton className="h-16 w-full" /><Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <div aria-busy={pending} className={`space-y-6 transition-opacity duration-fast ${pending ? 'opacity-70' : ''}`}>
              <StatStrip>
                <Stat label="Current profile" value={fmt.cycles(result.baseline_rul)} unit="cycles"
                  hint={`90% ${fmt.range(engine.intervals['0.9'].lower, engine.intervals['0.9'].upper)}`} />
                <Stat label="Scenario" value={fmt.cycles(result.counterfactual_rul)} unit="cycles"
                  hint={result.counterfactual_interval ? `90% ${fmt.range(result.counterfactual_interval.lower, result.counterfactual_interval.upper)}` : undefined} />
                <Stat label="Change" value={fmt.signed(result.rul_delta, 0)} unit="cycles" hint={`${fmt.signed(result.pct_change, 1)}% · stress ×${result.stress_ratio.toFixed(2)}`} />
              </StatStrip>

              <Panel title="Projected health index" description="Linear projection from today's health index to zero at the estimated remaining life.">
                <LineChart
                  x={result.baseline_curve.map((p) => p.cycle)}
                  series={[
                    { id: 'base', label: 'Current profile', color: 'var(--chart-1)', values: result.baseline_curve.map((p) => p.health) },
                    { id: 'cf', label: 'Scenario', color: 'var(--chart-2)', values: result.counterfactual_curve.map((p) => p.health), dashed: true },
                  ]}
                  yDomain={[0, 100]}
                  xLabel="Cycle"
                  formatY={(v) => `${v.toFixed(0)}%`}
                  height={240}
                  ariaLabel={`Projected health under current profile and scenario. Remaining life ${result.baseline_rul.toFixed(0)} versus ${result.counterfactual_rul.toFixed(0)} cycles.`}
                />
                <p className="text-sm text-fg-secondary mt-4">{result.recommendation}</p>
              </Panel>

              <Panel title="Assumptions behind this surrogate">
                <ul className="space-y-2 text-xs md:text-sm text-fg-secondary m-0 list-none p-0 font-mono">
                  {result.assumptions.map((a, i) => (
                    <li key={a} className="flex items-start gap-2.5">
                      <span className="text-primary font-bold shrink-0">[A0{i + 1}]</span>
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
