import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Stat, StatStrip } from '../components/ui/Stat';
import { ActionTag, Tag } from '../components/ui/StatusTag';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState } from '../components/ui/Feedback';
import { Icon } from '../components/ui/Icon';
import { StackedHistogram } from '../components/charts/StackedHistogram';
import { Fleet3DViewer } from '../components/fleet/Fleet3DViewer';
import { FAULT_SHORT, fmt } from '../lib/format';
import { href } from '../lib/router';
import { ActionCode, EngineSummary, FleetOverview } from '../lib/types';

type SortKey = 'engine_id' | 'current_cycle' | 'rul_pred' | 'rul_lower' | 'health_pct';
type ActionFilter = 'ALL' | ActionCode;

const ACTION_ORDER: Record<ActionCode, number> = { REMOVE: 0, INSPECT: 1, CONTINUE: 2 };

const COLUMNS: Array<{ key: SortKey | null; label: string; align?: 'right' }> = [
  { key: 'engine_id', label: '// UNIT_ID' },
  { key: null, label: '// ACTION_POLICY' },
  { key: 'rul_pred', label: '// RUL_PRED', align: 'right' },
  { key: 'rul_lower', label: '// 90%_INTERVAL', align: 'right' },
  { key: 'health_pct', label: '// HEALTH_IDX', align: 'right' },
  { key: null, label: '// FAULT_HYPOTHESIS' },
  { key: 'current_cycle', label: '// CYCLES', align: 'right' },
  { key: null, label: '// TELEMETRY_FLAGS' },
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
        eyebrow="NASA C-MAPSS FD004 TEST FLEET TELEMETRY"
        title="Fleet status"
        description="Live telemetry, conservative remaining-life estimates (90% conformal lower bound), and automated policy dispatches across all 248 turbofan units."
      />

      <Fleet3DViewer />

      <StatStrip className="mb-6">
        <Stat label="Total Units" value={fleet.total_engines} hint="Six flight regimes, two fault modes" />
        <Stat label="Plan Removal" value={fleet.action_counts.REMOVE} hint="Conservative RUL ≤ 20 cycles" />
        <Stat label="Inspect Unit" value={fleet.action_counts.INSPECT} hint="Conservative RUL 21–50 cycles" />
        <Stat label="Continue Ops" value={fleet.action_counts.CONTINUE} hint="Conservative RUL > 50 cycles" />
        <Stat label="Twin Drift" value={fleet.drift_count} hint="Decided on 95% conservative bound" />
      </StatStrip>

      <Panel
        title="Remaining useful life distribution"
        description="10-cycle predicted RUL bins stacked by automated decision policy. The policy acts on the interval's conservative lower bound."
        className="mb-6"
      >
        <StackedHistogram
          bins={histogram}
          keys={[
            { key: 'REMOVE', label: 'Plan removal (≤ 20)', color: 'var(--color-error)' },
            { key: 'INSPECT', label: 'Inspect unit (21–50)', color: 'var(--color-warning)' },
            { key: 'CONTINUE', label: 'Continue (> 50)', color: 'var(--color-success)' },
          ]}
          xLabel="Predicted RUL (cycles)"
          ariaLabel="Histogram of predicted remaining useful life for all engines, stacked by recommended action"
        />
      </Panel>

      <Panel
        padded={false}
        title="Fleet engines registry"
        description={`${rows.length} of ${fleet.total_engines} active units rendered. Click any unit code to inspect full digital twin.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<ActionFilter>
              label="Filter by action"
              value={action}
              onChange={setAction}
              options={[
                { value: 'ALL', label: 'ALL' },
                { value: 'REMOVE', label: 'REMOVE' },
                { value: 'INSPECT', label: 'INSPECT' },
                { value: 'CONTINUE', label: 'CONTINUE' },
              ]}
            />
            <label className="relative block">
              <span className="sr-only">Search engines</span>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/60 pointer-events-none">
                <Icon name="search" size={14} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="[ SEARCH_UNIT_ID ]"
                className="h-8 w-44 clip-cut-btn border border-line bg-surface-elevated pl-8 pr-2.5 text-xs font-mono text-fg placeholder:text-fg-muted/60 hover:border-primary focus:border-primary shadow-xs"
              />
            </label>
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="NO ENGINES MATCH THIS FILTER CRITERIA"
            action={
              <button
                type="button"
                className="text-xs font-mono text-primary hover:underline uppercase"
                onClick={() => {
                  setQuery('');
                  setAction('ALL');
                }}
              >
                [ RESET_ALL_FILTERS ]
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-xs font-mono">
              <thead>
                <tr className="bg-surface-sunken border-b border-line text-primary/75">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.label}
                      scope="col"
                      aria-sort={
                        c.key && sort.key === c.key
                          ? sort.dir === 1
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      className={`font-mono text-[11px] font-semibold h-9 px-4 whitespace-nowrap text-left ${
                        c.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {c.key ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key as SortKey)}
                          className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors ${
                            c.align === 'right' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {c.label}
                          <Icon
                            name={sort.key === c.key ? (sort.dir === 1 ? 'sortAsc' : 'sortDesc') : 'sort'}
                            size={12}
                          />
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {rows.map((e) => (
                  <FleetRow key={e.engine_id} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

const FleetRow: React.FC<{ e: EngineSummary }> = ({ e }) => (
  <tr className="hover:bg-primary-soft/30 hover:text-primary transition-colors duration-fast group">
    <th scope="row" className="h-10 px-4 text-left font-normal">
      <a
        href={href({ kind: 'engine', engineId: e.engine_id, page: 'overview' })}
        className="font-mono font-bold whitespace-nowrap text-primary group-hover:underline flex items-center gap-1.5"
      >
        <span className="w-1 h-1 bg-primary rotate-45 inline-block opacity-75" />
        <span>{e.unit_code}</span>
      </a>
    </th>
    <td className="px-4">
      <ActionTag action={e.action_code} />
    </td>
    <td className="px-4 text-right tabular font-bold text-fg group-hover:text-primary">
      {fmt.cycles(e.rul_pred)}
    </td>
    <td className="px-4 text-right tabular text-fg-secondary">
      {fmt.range(e.rul_lower, e.rul_upper)}
    </td>
    <td className="px-4 text-right">
      <span className="tabular font-medium text-fg">{fmt.pct(e.health_pct, 0)}</span>
    </td>
    <td className="px-4 text-fg-secondary">{FAULT_SHORT[e.fault_mode]}</td>
    <td className="px-4 text-right tabular text-fg-secondary">{e.current_cycle}</td>
    <td className="px-4">
      <span className="flex items-center gap-1.5">
        {e.drift_detected && <Tag tone="info">Discrepancy</Tag>}
        {e.anomaly_alarm && <Tag tone="neutral">Anomaly</Tag>}
      </span>
    </td>
  </tr>
);
