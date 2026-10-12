import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Stat, StatStrip } from '../components/ui/Stat';
import { ActionTag, Tag } from '../components/ui/StatusTag';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState } from '../components/ui/Feedback';
import { Icon } from '../components/ui/Icon';
import { StackedHistogram } from '../components/charts/StackedHistogram';
import { FAULT_SHORT, fmt } from '../lib/format';
import { href } from '../lib/router';
import { ActionCode, EngineSummary, FleetOverview } from '../lib/types';

type SortKey = 'engine_id' | 'current_cycle' | 'rul_pred' | 'rul_lower' | 'health_pct';
type ActionFilter = 'ALL' | ActionCode;

const ACTION_ORDER: Record<ActionCode, number> = { REMOVE: 0, INSPECT: 1, CONTINUE: 2 };

const COLUMNS: Array<{ key: SortKey | null; label: string; align?: 'right' }> = [
  { key: 'engine_id', label: 'Engine' },
  { key: null, label: 'Action' },
  { key: 'rul_pred', label: 'Predicted RUL', align: 'right' },
  { key: 'rul_lower', label: '90% interval', align: 'right' },
  { key: 'health_pct', label: 'Health index', align: 'right' },
  { key: null, label: 'Fault hypothesis' },
  { key: 'current_cycle', label: 'Cycles', align: 'right' },
  { key: null, label: 'Flags' },
];

export const FleetPage: React.FC<{ fleet: FleetOverview }> = ({ fleet }) => {
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<ActionFilter>('ALL');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rul_lower', dir: 1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fleet.engines
      .filter((e) => action === 'ALL' || e.action_code === action)
      .filter((e) => !q || e.unit_code.toLowerCase().includes(q) || String(e.engine_id).includes(q))
      .sort((a, b) => (a[sort.key] - b[sort.key]) * sort.dir || ACTION_ORDER[a.action_code] - ACTION_ORDER[b.action_code]);
  }, [fleet.engines, query, action, sort]);

  const histogram = useMemo(() => {
    const edges = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
    return edges.slice(0, -1).map((lo, i) => {
      const inBin = fleet.engines.filter((e) => e.rul_pred >= lo && e.rul_pred < edges[i + 1]);
      return {
        label: `${lo}`,
        counts: {
          REMOVE: inBin.filter((e) => e.action_code === 'REMOVE').length,
          INSPECT: inBin.filter((e) => e.action_code === 'INSPECT').length,
          CONTINUE: inBin.filter((e) => e.action_code === 'CONTINUE').length,
        },
      };
    });
  }, [fleet.engines]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  return (
    <>
      <PageHeader
        eyebrow="NASA C-MAPSS FD004 test fleet"
        title="Fleet status"
        description="Every engine's remaining-life estimate, its 90% interval and the maintenance action the decision policy recommends. Engines are sorted by the conservative bound, so the most urgent appear first."
      />

      <StatStrip className="mb-6">
        <Stat label="Engines monitored" value={fleet.total_engines} hint="Six operating conditions, two fault modes" />
        <Stat label="Plan removal" value={fleet.action_counts.REMOVE} hint="Conservative RUL ≤ 20 cycles" />
        <Stat label="Inspect" value={fleet.action_counts.INSPECT} hint="Conservative RUL 21–50 cycles" />
        <Stat label="Continue" value={fleet.action_counts.CONTINUE} hint="Conservative RUL above 50 cycles" />
        <Stat label="Twin discrepancy" value={fleet.drift_count} hint="Engines decided on the 95% bound" />
      </StatStrip>

      <Panel
        title="Predicted remaining life across the fleet"
        description="Engines per 10-cycle band of predicted RUL, colored by the recommended action. The action uses the interval's lower bound, which is why some engines with a mid-range estimate are already flagged for inspection."
        className="mb-6"
      >
        <StackedHistogram
          bins={histogram}
          keys={[
            { key: 'REMOVE', label: 'Plan removal', color: 'var(--color-error)' },
            { key: 'INSPECT', label: 'Inspect', color: 'var(--color-warning)' },
            { key: 'CONTINUE', label: 'Continue', color: 'var(--color-success)' },
          ]}
          xLabel="Predicted RUL (cycles)"
          ariaLabel="Histogram of predicted remaining useful life for all engines, stacked by recommended action"
        />
      </Panel>

      <Panel
        padded={false}
        title="Engines"
        description={`${rows.length} of ${fleet.total_engines} shown. Select an engine to open its twin.`}
        actions={
          <>
            <Segmented<ActionFilter>
              label="Filter by action"
              value={action}
              onChange={setAction}
              options={[
                { value: 'ALL', label: 'All' },
                { value: 'REMOVE', label: 'Removal' },
                { value: 'INSPECT', label: 'Inspect' },
                { value: 'CONTINUE', label: 'Continue' },
              ]}
            />
            <label className="relative block">
              <span className="sr-only">Search engines</span>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none"><Icon name="search" size={16} /></span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search, e.g. 117"
                className="h-8 w-44 rounded-md border border-line bg-surface pl-8 pr-2 text-sm placeholder:text-fg-muted hover:border-line-strong"
              />
            </label>
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyState title="No engines match these filters" action={
            <button type="button" className="text-sm text-primary-text underline" onClick={() => { setQuery(''); setAction('ALL'); }}>
              Clear filters
            </button>
          } />
        ) : (
          <div className="overflow-x-auto mt-4 border-t border-line">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-surface-sunken text-left">
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.label}
                      scope="col"
                      aria-sort={c.key && sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                      className={`label font-medium h-10 px-4 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}
                    >
                      {c.key ? (
                        <button type="button" onClick={() => toggleSort(c.key as SortKey)}
                          className={`inline-flex items-center gap-1 hover:text-fg ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                          {c.label}
                          <Icon name={sort.key === c.key ? (sort.dir === 1 ? 'sortAsc' : 'sortDesc') : 'sort'} size={12} />
                        </button>
                      ) : c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => <FleetRow key={e.engine_id} e={e} />)}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

const FleetRow: React.FC<{ e: EngineSummary }> = ({ e }) => (
  <tr className="border-t border-line-subtle hover:bg-surface-interactive transition-colors duration-fast">
    <th scope="row" className="h-11 px-4 text-left font-normal">
      <a href={href({ kind: 'engine', engineId: e.engine_id, page: 'overview' })} className="font-mono font-medium whitespace-nowrap">
        {e.unit_code}
      </a>
    </th>
    <td className="px-4"><ActionTag action={e.action_code} /></td>
    <td className="px-4 text-right tabular font-medium">{fmt.cycles(e.rul_pred)}</td>
    <td className="px-4 text-right tabular text-fg-secondary">{fmt.range(e.rul_lower, e.rul_upper)}</td>
    <td className="px-4 text-right">
      <span className="tabular">{fmt.pct(e.health_pct, 0)}</span>
    </td>
    <td className="px-4 text-fg-secondary">{FAULT_SHORT[e.fault_mode]}</td>
    <td className="px-4 text-right tabular text-fg-secondary">{e.current_cycle}</td>
    <td className="px-4">
      <span className="flex gap-1.5">
        {e.drift_detected && <Tag tone="info">Discrepancy</Tag>}
        {e.anomaly_alarm && <Tag tone="neutral">Anomaly</Tag>}
      </span>
    </td>
  </tr>
);
