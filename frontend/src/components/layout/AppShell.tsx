import React, { useEffect, useRef, useState } from 'react';
import { EnginePage, GlobalPage, href, navigate, Route } from '../../lib/router';
import { ThemePreference, useTheme } from '../../lib/theme';
import { EngineSummary } from '../../lib/types';
import { Icon } from '../ui/Icon';
import { Segmented } from '../ui/Segmented';

interface NavItem {
  label: string;
  route: Route;
}

interface AppShellProps {
  route: Route;
  engineId: number | null;
  fleet: EngineSummary[] | null;
  children: React.ReactNode;
}

const ENGINE_NAV: Array<{ page: EnginePage; label: string }> = [
  { page: 'overview', label: 'Overview' },
  { page: 'twin', label: 'Twin state' },
  { page: 'prognosis', label: 'Prognosis' },
  { page: 'diagnostics', label: 'Diagnostics' },
  { page: 'drift', label: 'Drift & calibration' },
  { page: 'scenarios', label: 'What-if scenarios' },
  { page: 'advisor', label: 'Maintenance advisor' },
];

const GLOBAL_NAV: Array<{ page: GlobalPage; label: string; group: 'fleet' | 'research' }> = [
  { page: 'fleet', label: 'Fleet status', group: 'fleet' },
  { page: 'evaluation', label: 'Evaluation', group: 'research' },
  { page: 'about', label: 'Data & methods', group: 'research' },
];

const isActive = (route: Route, item: Route) =>
  route.kind === item.kind && route.page === item.page && (route.kind === 'global' || (item.kind === 'engine' && route.engineId === item.engineId));

const NavList: React.FC<{ route: Route; engineId: number | null; onNavigate?: () => void }> = ({ route, engineId, onNavigate }) => {
  const groups: Array<{ title: string; items: NavItem[] }> = [
    { title: 'Fleet', items: GLOBAL_NAV.filter((g) => g.group === 'fleet').map((g) => ({ label: g.label, route: { kind: 'global', page: g.page } })) },
  ];
  if (engineId != null) {
    groups.push({
      title: `Engine FD004-${String(engineId).padStart(3, '0')}`,
      items: ENGINE_NAV.map((e) => ({ label: e.label, route: { kind: 'engine', page: e.page, engineId } })),
    });
  }
  groups.push({ title: 'Research', items: GLOBAL_NAV.filter((g) => g.group === 'research').map((g) => ({ label: g.label, route: { kind: 'global', page: g.page } })) });

  return (
    <nav aria-label="Primary" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="label px-3 mb-1.5">{g.title}</p>
          <ul className="list-none p-0 m-0 space-y-px">
            {g.items.map((item) => {
              const active = isActive(route, item.route);
              return (
                <li key={item.label}>
                  <a
                    href={href(item.route)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center h-9 px-3 rounded-md text-sm no-underline transition-colors duration-fast ${
                      active
                        ? 'bg-primary-soft text-primary-text font-medium'
                        : 'text-fg-secondary hover:bg-surface-interactive hover:text-fg'
                    }`}
                  >
                    {item.label}
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
        { value: 'light', label: <span className="flex items-center gap-1"><Icon name="sun" size={14} /><span className="sr-only">Light</span></span> },
        { value: 'system', label: <span className="flex items-center gap-1"><Icon name="system" size={14} /><span className="sr-only">System</span></span> },
        { value: 'dark', label: <span className="flex items-center gap-1"><Icon name="moon" size={14} /><span className="sr-only">Dark</span></span> },
      ]}
    />
  );
};

const EngineSelect: React.FC<{ route: Route; engineId: number | null; fleet: EngineSummary[] | null }> = ({ route, engineId, fleet }) => {
  if (!fleet || fleet.length === 0) return null;
  const onChange = (id: number) => {
    navigate({ kind: 'engine', engineId: id, page: route.kind === 'engine' ? route.page : 'overview' });
  };
  return (
    <label className="flex items-center gap-2 min-w-0">
      <span className="text-sm text-fg-muted hidden sm:inline">Engine</span>
      <select
        className="select h-9 rounded-md border border-line bg-surface text-sm font-mono pl-3 hover:border-line-strong min-w-0 max-w-[11rem]"
        value={engineId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Select engine"
      >
        {engineId == null && <option value="">Choose…</option>}
        {fleet.map((e) => (
          <option key={e.engine_id} value={e.engine_id}>{e.unit_code}</option>
        ))}
      </select>
    </label>
  );
};

export const AppShell: React.FC<AppShellProps> = ({ route, engineId, fleet, children }) => {
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
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        onClick={(e) => {
          // The hash is the router; move focus without changing it.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-surface-elevated text-fg px-3 py-2 rounded-md shadow-md">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 h-header bg-surface border-b border-line">
        <div className="h-full flex items-center gap-3 px-gutter">
          <button
            ref={menuButtonRef}
            type="button"
            className="lg:hidden -ml-2 w-10 h-10 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-interactive"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <a href="#/fleet" className="flex items-center gap-2.5 no-underline text-fg shrink-0" aria-label="TwinAero, fleet status">
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="5" fill="var(--color-primary)" />
              <circle cx="16" cy="16" r="9" fill="none" stroke="var(--color-on-primary)" strokeWidth="2" />
              <path d="M16 7v18M7 16h18" stroke="var(--color-on-primary)" strokeWidth="1.5" />
            </svg>
            <span className="font-semibold tracking-tight">TwinAero</span>
            <span className="hidden md:inline text-sm text-fg-muted border-l border-line pl-2.5">C-MAPSS FD004</span>
          </a>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
            <EngineSelect route={route} engineId={engineId} fleet={fleet} />
            <div className="hidden sm:block"><ThemeControl /></div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="hidden lg:block w-sidebar shrink-0 border-r border-line bg-surface">
          <div className="sticky top-header max-h-[calc(100vh-var(--header-height))] overflow-y-auto px-3 py-6">
            <NavList route={route} engineId={engineId} />
          </div>
        </aside>

        <main id="main" tabIndex={-1} className="flex-1 min-w-0 focus:outline-none">
          <div className="max-w-container mx-auto px-gutter py-6 md:py-8">{children}</div>
          <footer className="max-w-container mx-auto px-gutter pb-8 pt-4">
            <div className="border-t border-line pt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-fg-muted">
              <p>
                Data: NASA C-MAPSS turbofan degradation simulation (Saxena et al., 2008), NASA Prognostics Center of Excellence.
                Research prototype, not for operational use.
              </p>
              <p className="flex gap-4 shrink-0">
                <a href="#/about#terms">Terms of use</a>
                <a href="#/about#privacy">Privacy</a>
              </p>
            </div>
          </footer>
        </main>
      </div>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0" style={{ background: 'rgb(0 0 0 / 0.4)' }} onClick={() => setDrawerOpen(false)} />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] bg-surface border-r border-line shadow-lg flex flex-col">
            <div className="h-header flex items-center justify-between px-4 border-b border-line">
              <span className="font-semibold">TwinAero</span>
              <button type="button" className="w-10 h-10 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-interactive"
                aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavList route={route} engineId={engineId} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-line p-4 flex items-center justify-between">
              <span className="text-sm text-fg-muted">Theme</span>
              <ThemeControl />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
