import React, { useMemo, useState } from 'react';
import { EngineHeader } from '../components/engine/EngineHeader';
import { channelLabel, lowerFirst, Station, STATIONS } from '../components/engine/sensors';
import { LineChart } from '../components/charts/LineChart';
import { Panel } from '../components/ui/Panel';
import { Tag, Tone } from '../components/ui/StatusTag';
import { fmt } from '../lib/format';
import { EngineDetail, SensorReading } from '../lib/types';

const shiftState = (sigma: number): { tone: Tone; label: string } =>
  Math.abs(sigma) >= 2 ? { tone: 'danger', label: 'Large shift' } : Math.abs(sigma) >= 1 ? { tone: 'warning', label: 'Shift' } : { tone: 'success', label: 'Nominal' };

export const TwinStatePage: React.FC<{ engine: EngineDetail }> = ({ engine }) => {
  const byKey = useMemo(() => Object.fromEntries(engine.latest_sensors.map((s) => [s.key, s])), [engine.latest_sensors]);

  const stationShift = (st: Station) => {
    const vals = st.sensors.map((k) => byKey[k]?.shift_sigma).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a)) : 0;
  };

  const initial = useMemo(
    () => STATIONS.reduce((best, st) => (Math.abs(stationShift(st)) > Math.abs(stationShift(best)) ? st : best), STATIONS[0]).id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine.engine_id],
  );
  const [selected, setSelected] = useState(initial);
  const station = STATIONS.find((s) => s.id === selected)!;
  const stationSensors = station.sensors.map((k) => byKey[k]).filter((s): s is SensorReading => !!s && s.informative);
  const cycles = engine.telemetry_history.map((h) => h.cycle);

  return (
    <>
      <EngineHeader
        engine={engine}
        title="Twin state"
        description="Where along the gas path the sensors have moved. Values are regime-normalized: each reading is compared with healthy engines in the same operating condition, so flight-envelope changes cancel out and wear remains."
      />

      <Panel
        title="Gas path"
        description="Select a station to see the channels that observe it. The label shows its largest shift since the first 15 observed cycles."
        className="mb-6"
      >
        <div role="group" aria-label="Engine stations" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-line border border-line rounded-md overflow-hidden">
          {STATIONS.map((st) => {
            const sigma = stationShift(st);
            const state = shiftState(sigma);
            const active = st.id === selected;
            return (
              <button
                key={st.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(st.id)}
                className={`text-left p-3 md:p-4 clip-cut-btn transition-all duration-fast ${
                  active
                    ? 'bg-surface-elevated text-primary border-l-2 border-primary shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                    : 'bg-surface hover:bg-surface-interactive text-fg hover:text-primary'
                }`}
              >
                <span className={`block text-xs md:text-sm font-display font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-fg'}`}>
                  {"// "}{st.short}
                </span>
                <span className="block text-[11px] font-mono text-fg-muted mt-0.5 truncate">{st.name}</span>
                <span className="flex items-center justify-between gap-2 mt-3">
                  <span className="font-mono text-xs tabular font-bold">{fmt.signed(sigma, 1)}σ</span>
                  <Tag tone={state.tone}>{state.label}</Tag>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-fg-muted mt-3">
          Flow runs left to right: fan, compressors, combustor, turbines. FD004 degrades the HPC or the fan; downstream stations shift as a consequence.
        </p>
      </Panel>

      <Panel
        title={`${station.name}: sensor trends`}
        description="10-cycle rolling mean of each regime-normalized channel. Zero is the fleet's healthy average for the same operating condition."
        className="mb-6"
      >
        {stationSensors.length === 0 ? (
          <p className="text-sm text-fg-muted">The channels at this station are constant in FD004 and carry no degradation information.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
            {stationSensors.map((s) => (
              <div key={s.key}>
                <p className="text-sm font-medium mb-1">
                  {channelLabel(s.key)} <span className="text-fg-muted font-normal">· {s.name}, {lowerFirst(s.description)}</span>
                </p>
                <LineChart
                  compact
                  height={140}
                  x={cycles}
                  series={[{ id: s.key, label: channelLabel(s.key), color: 'var(--chart-1)', values: engine.telemetry_history.map((h) => h.sensors[s.key] ?? null) }]}
                  formatY={(v) => v.toFixed(1)}
                  ariaLabel={`${channelLabel(s.key)} trend over ${cycles.length} cycles, shifted ${s.shift_sigma?.toFixed(2)} standard deviations`}
                  showLegend={false}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        padded={false}
        title="All channels at the latest cycle"
        description="Channel mnemonics follow Saxena et al. (2008). The dataset itself ships unlabeled columns, so the channel number is the primary identifier."
      >
        <div className="overflow-x-auto mt-4 border-t border-line">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-surface-sunken text-left">
              <tr>
                <th scope="col" className="label font-medium h-10 px-4">Channel</th>
                <th scope="col" className="label font-medium h-10 px-4">Literature mapping</th>
                <th scope="col" className="label font-medium h-10 px-4 text-right">Raw value</th>
                <th scope="col" className="label font-medium h-10 px-4 text-right">Normalized</th>
                <th scope="col" className="label font-medium h-10 px-4 text-right">Shift since start</th>
              </tr>
            </thead>
            <tbody>
              {engine.latest_sensors.map((s) => (
                <tr key={s.key} className="border-t border-line-subtle">
                  <th scope="row" className="h-10 px-4 text-left font-medium whitespace-nowrap">{channelLabel(s.key)}</th>
                  <td className="px-4 text-fg-secondary">
                    {s.name} · {s.description}{s.unit !== '-' ? ` (${s.unit})` : ''}
                  </td>
                  <td className="px-4 text-right font-mono tabular">{s.raw_value.toFixed(2)}</td>
                  <td className="px-4 text-right font-mono tabular">{s.informative ? `${fmt.signed(s.norm_value!, 2)}σ` : '–'}</td>
                  <td className="px-4 text-right">
                    {s.informative ? (
                      <span className="font-mono tabular">{fmt.signed(s.shift_sigma!, 2)}σ</span>
                    ) : (
                      <span className="text-xs text-fg-muted">Constant in FD004</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
};
