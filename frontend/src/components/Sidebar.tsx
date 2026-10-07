import React from 'react';
import {
  LayoutDashboard,
  Users,
  Binary,
  Clock,
  AlertOctagon,
  Percent,
  Sliders,
  Activity,
  Bot,
  Layers,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'fleet'
  | 'digital-twin'
  | 'rul'
  | 'faults'
  | 'uncertainty'
  | 'simulation'
  | 'drift'
  | 'advisor';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  criticalCount: number;
  monitorCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  criticalCount,
  monitorCount,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'fleet',
      label: 'Engine Fleet',
      icon: <Users className="w-4 h-4" />,
      badge: `${criticalCount + monitorCount}`,
      badgeColor: criticalCount > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300',
    },
    { id: 'digital-twin', label: 'Digital Twin', icon: <Binary className="w-4 h-4" /> },
    { id: 'rul', label: 'RUL Prognostics', icon: <Clock className="w-4 h-4" /> },
    { id: 'faults', label: 'Fault Diagnostics', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'uncertainty', label: 'Uncertainty Layer', icon: <Percent className="w-4 h-4" /> },
    { id: 'simulation', label: 'What-If Simulation', icon: <Sliders className="w-4 h-4" /> },
    { id: 'drift', label: 'Drift & Calibration', icon: <Activity className="w-4 h-4" /> },
    { id: 'advisor', label: 'AI Advisor', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-avionics-850 border-r border-avionics-border flex flex-col justify-between p-4 flex-shrink-0">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 px-3">
          Avionics Telemetry
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dataset Info Box */}
      <div className="p-3 rounded-lg bg-avionics-900 border border-avionics-border text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>NASA C-MAPSS FD004</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          6 Operating Conditions, Dual Fault Modes (HPC & Fan Degradation), 248 Evaluation Engines.
        </p>
      </div>
    </aside>
  );
};
