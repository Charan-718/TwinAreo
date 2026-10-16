import React, { useEffect, useRef, useState } from 'react';
import { EnginePage, GlobalPage, href, navigate, Route } from '../../lib/router';
import { ThemePreference, useTheme } from '../../lib/theme';
import { EngineSummary } from '../../lib/types';
import { Icon } from '../ui/Icon';
import { Segmented } from '../ui/Segmented';

interface NavItem {
  label: string;
  route: Route;
  tag?: string;
}

interface AppShellProps {
  route: Route;
  engineId: number | null;
  fleet: EngineSummary[] | null;
  children: React.ReactNode;
}

const ENGINE_NAV: Array<{ page: EnginePage; label: string; tag: string }> = [
  { page: 'overview', label: 'Overview', tag: '01' },
  { page: 'twin', label: 'Twin state', tag: '02' },
  { page: 'prognosis', label: 'Prognosis', tag: '03' },
  { page: 'diagnostics', label: 'Diagnostics', tag: '04' },
  { page: 'drift', label: 'Drift & calibration', tag: '05' },
  { page: 'scenarios', label: 'What-if scenarios', tag: '06' },
  { page: 'advisor', label: 'Maintenance advisor', tag: '07' },
];

const GLOBAL_NAV: Array<{ page: GlobalPage; label: string; group: 'fleet' | 'research'; tag: string }> = [
  { page: 'fleet', label: 'Fleet status', group: 'fleet', tag: 'SYS' },
  { page: 'evaluation', label: 'Evaluation', group: 'research', tag: 'EXP' },
  { page: 'about', label: 'Data & methods', group: 'research', tag: 'DOC' },
];

const isActive = (route: Route, item: Route) =>
  route.kind === item.kind &&
  route.page === item.page &&
  (route.kind === 'global' ||
    (item.kind === 'engine' && route.engineId === item.engineId));

const NavList: React.FC<{
  route: Route;
  engineId: number | null;
  onNavigate?: () => void;
}> = ({ route, engineId, onNavigate }) => {
  const groups: Array<{ title: string; prefix: string; items: NavItem[] }> = [
    {
      title: 'FLEET_OPERATIONS',
      prefix: '// 01',
      items: GLOBAL_NAV.filter((g) => g.group === 'fleet').map((g) => ({
        label: g.label,
        tag: g.tag,
        route: { kind: 'global', page: g.page },
      })),
    },
  ];
  if (engineId != null) {
    groups.push({
      title: `FD004-${String(engineId).padStart(3, '0')}`,
      prefix: '// 02',
      items: ENGINE_NAV.map((e) => ({
        label: e.label,
        tag: e.tag,
        route: { kind: 'engine', page: e.page, engineId },
      })),
    });
  }
  groups.push({
    title: 'BENCHMARK_RESEARCH',
    prefix: '// 03',
    items: GLOBAL_NAV.filter((g) => g.group === 'research').map((g) => ({
      label: g.label,
      tag: g.tag,
      route: { kind: 'global', page: g.page },
    })),
  });

  return (
    <nav aria-label="Primary" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="flex items-center justify-between px-3 mb-2 font-mono text-[11px] text-primary/75 tracking-wider uppercase">
            <span>
              <span className="text-primary mr-1.5 opacity-60">{g.prefix}</span>
              {g.title}
            </span>
            <span className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
          </div>
          <ul className="list-none p-0 m-0 space-y-1">
            {g.items.map((item) => {
              const active = isActive(route, item.route);
              return (
                <li key={item.label}>
                  <a
                    href={href(item.route)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between h-9 px-3 clip-cut-btn text-xs font-display font-semibold uppercase tracking-wider no-underline transition-all duration-fast ${
                      active
                        ? 'bg-surface-elevated text-primary border-l-2 border-primary shadow-[0_0_12px_rgba(0,255,157,0.25)]'
                        : 'text-fg-secondary hover:bg-surface-interactive/70 hover:text-primary hover:border-l-2 hover:border-primary/40'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 ${
                          active ? 'bg-primary shadow-[0_0_6px_#00ff9d]' : 'bg-line-strong'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.tag && (
                      <span className="font-mono text-[10px] text-primary/60 opacity-80 shrink-0">
                        [{item.tag}]
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

const ThemeControl: React.FC = () => {
  const { preference, choose } = useTheme();
  return (
    <Segmented<ThemePreference>
      label="Color theme"
      value={preference}
      onChange={choose}
      options={[
        {
          value: 'light',
          label: (
            <span className="flex items-center gap-1.5 px-0.5">
              <Icon name="sun" size={13} />
              <span className="sr-only">Light</span>
            </span>
          ),
        },
        {
          value: 'system',
          label: (
            <span className="flex items-center gap-1.5 px-0.5 font-mono text-[11px]">
              SYS
            </span>
          ),
        },
        {
          value: 'dark',
          label: (
            <span className="flex items-center gap-1.5 px-0.5">
              <Icon name="moon" size={13} />
              <span className="sr-only">Dark</span>
            </span>
          ),
        },
      ]}
    />
  );
};

const EngineSelect: React.FC<{
  route: Route;
  engineId: number | null;
  fleet: EngineSummary[] | null;
}> = ({ route, engineId, fleet }) => {
  if (!fleet || fleet.length === 0) return null;
  const onChange = (id: number) => {
    navigate({
      kind: 'engine',
      engineId: id,
      page: route.kind === 'engine' ? route.page : 'overview',
    });
  };
  return (
    <label className="flex items-center gap-2 min-w-0">
      <span className="text-[11px] font-mono text-primary uppercase tracking-wider hidden sm:inline">
        {"//"} UNIT
      </span>
      <select
        className="select h-8 clip-cut-btn border border-line bg-surface-elevated text-xs font-mono pl-3 text-fg hover:border-primary focus:border-primary shadow-xs min-w-0 max-w-[11rem]"
        value={engineId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Select engine"
      >
        {engineId == null && <option value="">Choose…</option>}
        {fleet.map((e) => (
          <option key={e.engine_id} value={e.engine_id}>
            {e.unit_code}
          </option>
        ))}
      </select>
    </label>
  );
};

export const AppShell: React.FC<AppShellProps> = ({
  route,
  engineId,
  fleet,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const returnFocusTo = menuButtonRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      returnFocusTo?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-surface-elevated text-primary font-mono px-3 py-2 clip-cut-btn border border-primary shadow-[0_0_12px_rgba(0,255,157,0.4)]"
      >
        [ SKIP_TO_CONTENT ]
      </a>

      {/* ─── HOLLYWOOD HACKER CYBER DECK HEADER ─── */}
      <header className="sticky top-0 z-30 h-header border-b border-line bg-surface/90 backdrop-blur-md shadow-xs">
        <div className="h-full flex items-center justify-between gap-3 px-gutter max-w-container mx-auto">
          <div className="flex items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="lg:hidden -ml-1.5 w-9 h-9 clip-cut-btn inline-flex items-center justify-center text-fg-secondary hover:bg-surface-interactive hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="menu" size={18} />
            </button>

            {/* Stylized Hollywood Hacker TwinAero Brand Logo */}
            <a
              href="#/fleet"
              className="flex items-center gap-2.5 no-underline text-fg shrink-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="TwinAero, fleet status"
            >
              {/* Left Circuit Branch (From Reference Image 1) */}
              <div className="hidden sm:flex items-center text-primary/70 -mr-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 bg-primary/80 rotate-45" />
                <span className="w-3 h-px bg-primary/50" />
                <span className="w-1 h-1 bg-primary/60 inline-block" />
                <span className="w-2 h-px bg-primary/50" />
              </div>

              {/* Cut-Angle Hexagon Turbine Emblem */}
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]">
                <polygon points="16,2 29,8 29,24 16,30 3,24 3,8" fill="var(--color-surface-elevated)" stroke="var(--color-primary)" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="7" stroke="var(--color-primary)" strokeWidth="1.25" strokeDasharray="3 2" />
                <polygon points="16,9 21,16 16,23 11,16" fill="var(--color-error)" />
                <circle cx="16" cy="16" r="2.5" fill="var(--color-primary)" />
              </svg>

              {/* Geometric Cut Hacker Typography */}
              <div className="flex flex-col">
                <span className="text-[9px] font-mono tracking-[0.22em] text-primary/80 leading-none mb-0.5">
                  THE // DIGITAL TWIN
                </span>
                <div className="flex items-center tracking-[0.12em] font-display font-black text-lg text-fg leading-none">
                  <span className="text-fg">TWIN</span>
                  <span className="text-primary relative" style={{ textShadow: '0 0 8px rgba(0,255,157,0.4)' }}>
                    AER
                    <span className="text-danger inline-block relative">
                      O
                      <span className="absolute -top-1 -right-1 w-1 h-1 bg-danger rotate-45" />
                    </span>
                  </span>
                </div>
              </div>

              {/* Right Circuit Branch */}
              <div className="hidden md:flex items-center text-primary/70 ml-1" aria-hidden="true">
                <span className="w-2 h-px bg-primary/50" />
                <span className="w-1 h-1 bg-primary/60 inline-block" />
                <span className="w-3 h-px bg-primary/50" />
                <span className="w-1.5 h-1.5 bg-danger/90 rotate-45 shadow-[0_0_6px_#ff0055]" />
              </div>

              {/* Telemetry Node Indicator */}
              <span className="hidden xl:inline clip-badge bg-surface-elevated border border-line text-[10px] font-mono px-2 py-0.5 text-primary items-center gap-1 ml-2">
                &lt; FD004 // ONLINE &gt;
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <EngineSelect route={route} engineId={engineId} fleet={fleet} />
            <div className="hidden sm:block">
              <ThemeControl />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-container w-full mx-auto">
        {/* ─── CYBER SIDEBAR NAVIGATION ─── */}
        <aside className="hidden lg:block w-sidebar shrink-0 border-r border-line bg-surface/30">
          <div className="sticky top-header max-h-[calc(100vh-var(--header-height))] overflow-y-auto px-3.5 py-6">
            <NavList route={route} engineId={engineId} />
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ─── */}
        <main id="main" tabIndex={-1} className="flex-1 min-w-0 focus:outline-none flex flex-col justify-between">
          <div className="px-gutter py-6 md:py-8">{children}</div>

          <footer className="px-gutter pb-8 pt-4 mt-auto">
            <div className="border-t border-line pt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-fg-muted font-mono">
              <p className="flex items-center gap-2">
                <span className="text-primary">&gt;&gt;</span>
                <span>NASA C-MAPSS FD004 // TURBOFAN PROGNOSTIC DIGITAL TWIN (SAXENA ET AL., 2008)</span>
              </p>
              <p className="flex gap-4 shrink-0 font-medium">
                <a href="#/about#terms" className="text-fg-muted hover:text-primary transition-colors">[ TERMS_OF_USE ]</a>
                <a href="#/about#privacy" className="text-fg-muted hover:text-primary transition-colors">[ PRIVACY_POLICY ]</a>
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ─── MOBILE DRAWER OVERLAY ─── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] border-r border-primary/40 bg-surface shadow-[0_0_30px_rgba(0,255,157,0.2)] flex flex-col clip-cut-corner"
          >
            <div className="h-header flex items-center justify-between px-4 border-b border-line">
              <span className="font-display font-bold text-fg tracking-wider">[ TWINAERO // MENU ]</span>
              <button
                type="button"
                className="w-9 h-9 clip-cut-btn inline-flex items-center justify-center text-fg-secondary hover:bg-surface-interactive hover:text-primary"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <NavList route={route} engineId={engineId} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-line p-4 flex items-center justify-between">
              <span className="text-xs font-mono text-primary uppercase tracking-wider">{"//"} THEME</span>
              <ThemeControl />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
