import React, { useState } from 'react';
import { EngineDetail } from '../types';
import { RotateCw } from 'lucide-react';

interface DigitalTwinEngineViewProps {
  engine: EngineDetail;
}

interface ComponentHotspot {
  id: string;
  name: string;
  tag: string;
  x: number;
  y: number;
  temperature: string;
  pressure: string;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  description: string;
}

export const DigitalTwinEngineView: React.FC<DigitalTwinEngineViewProps> = ({ engine }) => {
  const [selectedComponent, setSelectedComponent] = useState<string>('hpc');

  // Find sensor values
  const getSensor = (name: string, fallback: string) => {
    const s = engine.latest_sensors.find((x) => x.name === name);
    return s ? `${s.raw_value.toFixed(1)} ${s.unit}` : fallback;
  };

  const isHPCFault = engine.fault_mode.includes('HPC');
  const isFanFault = engine.fault_mode.includes('FAN');

  const hotspots: ComponentHotspot[] = [
    {
      id: 'fan',
      name: 'Fan & Inlet Diffuser',
      tag: 'Station 2',
      x: 120,
      y: 130,
      temperature: getSensor('T2', '518.7 °R'),
      pressure: getSensor('P2', '14.7 psia'),
      status: isFanFault ? 'WARNING' : 'NOMINAL',
      description: 'Wide-chord titanium fan blades. Measures physical fan speed Nf and inlet ram pressure P2.',
    },
    {
      id: 'lpc',
      name: 'Low-Pressure Compressor (LPC)',
      tag: 'Station 2.4',
      x: 230,
      y: 130,
      temperature: getSensor('T24', '642.1 °R'),
      pressure: getSensor('P15', '21.6 psia'),
      status: 'NOMINAL',
      description: 'Axial multi-stage low pressure booster compressing core airflow prior to HPC entry.',
    },
    {
      id: 'hpc',
      name: 'High-Pressure Compressor (HPC)',
      tag: 'Station 3',
      x: 360,
      y: 130,
      temperature: getSensor('T30', '1582.4 °R'),
      pressure: getSensor('P30', '552.1 psia'),
      status: isHPCFault ? 'CRITICAL' : 'NOMINAL',
      description: '10-stage high pressure compressor. Monitors discharge temp T30 and static pressure Ps30.',
    },
    {
      id: 'combustor',
      name: 'Annular Combustor',
      tag: 'Station 4',
      x: 480,
      y: 130,
      temperature: '2350 °R',
      pressure: getSensor('phi', '8.4 pps/psi'),
      status: 'NOMINAL',
      description: 'High-efficiency annular combustor mixing atomized jet fuel with core high-pressure air.',
    },
    {
      id: 'hpt',
      name: 'High-Pressure Turbine (HPT)',
      tag: 'Station 4.5',
      x: 580,
      y: 130,
      temperature: getSensor('htBleed', '391.2 BTU/lbm'),
      pressure: getSensor('W31', '38.5 lbm/s'),
      status: 'NOMINAL',
      description: 'Single-stage cooled turbine driving the high-pressure spool and compressor core shaft.',
    },
    {
      id: 'lpt',
      name: 'Low-Pressure Turbine (LPT)',
      tag: 'Station 5',
      x: 680,
      y: 130,
      temperature: getSensor('T50', '1408.2 °R'),
      pressure: getSensor('epr', '1.30'),
      status: 'NOMINAL',
      description: 'Multi-stage uncooled turbine extracting residual thermal work to drive the front fan spool.',
    },
  ];

  const currentComp = hotspots.find((h) => h.id === selectedComponent) || hotspots[2];

  return (
    <div className="space-y-4">
      {/* Schematic Container */}
      <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-cyan-400" />
              Aerospace Turbofan Digital Twin State
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 2-Spool High-Bypass Engine Geometry (C-MAPSS Model Specification)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Health:</span>
            <span
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                engine.health_pct > 75
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : engine.health_pct > 45
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {engine.health_pct}% ({engine.status})
            </span>
          </div>
        </div>

        {/* Vector SVG Schematic Cutaway */}
        <div className="relative w-full bg-avionics-900/90 rounded-lg border border-avionics-border p-3 overflow-x-auto">
          <svg viewBox="0 0 820 260" className="w-full h-auto min-w-[700px]">
            <defs>
              <linearGradient id="engineBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#0f172a" />
                <stop offset="60%" stopColor="#450a0a" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="bypassStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </linearGradient>

              <radialGradient id="combustorGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            {/* Nacelle Cowling Outer Shell */}
            <path
              d="M 60,40 Q 200,20 400,22 Q 650,25 760,50 L 760,70 Q 640,55 400,52 Q 180,50 60,65 Z"
              fill="rgba(51, 65, 85, 0.4)"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M 60,220 Q 200,240 400,238 Q 650,235 760,210 L 760,190 Q 640,205 400,208 Q 180,210 60,195 Z"
              fill="rgba(51, 65, 85, 0.4)"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1.5"
            />

            {/* Bypass Duct Airflow Zone */}
            <rect x="140" y="55" width="560" height="30" fill="url(#bypassStreamGrad)" />
            <rect x="140" y="175" width="560" height="30" fill="url(#bypassStreamGrad)" />

            {/* Core Casing Shell */}
            <path
              d="M 180,85 L 300,88 L 440,92 L 530,95 L 620,95 L 720,105 L 720,155 L 620,165 L 530,165 L 440,168 L 300,172 L 180,175 Z"
              fill="url(#engineBodyGrad)"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1.5"
            />

            {/* Centerline Shaft */}
            <line
              x1="90"
              y1="130"
              x2="740"
              y2="130"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeDasharray="8 4"
              opacity="0.8"
            />

            {/* Subsystem Cutaways */}
            {/* 1. Fan Blades */}
            <g transform="translate(100, 70)">
              <rect x="0" y="0" width="30" height="120" rx="4" fill="#0284c7" opacity="0.4" />
              <line x1="5" y1="10" x2="25" y2="110" stroke="#38bdf8" strokeWidth="2" />
              <line x1="15" y1="5" x2="15" y2="115" stroke="#38bdf8" strokeWidth="2" />
              <text x="15" y="135" fill="#7dd3fc" fontSize="10" textAnchor="middle" fontFamily="monospace">
                FAN
              </text>
            </g>

            {/* 2. LPC Booster */}
            <g transform="translate(200, 90)">
              <polygon points="0,0 35,5 35,75 0,80" fill="#0369a1" opacity="0.5" />
              <text x="18" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                LPC
              </text>
            </g>

            {/* 3. HPC Compressor (Highlight red/amber if degraded) */}
            <g transform="translate(320, 92)">
              <polygon
                points="0,0 70,10 70,66 0,76"
                fill={isHPCFault ? '#b91c1c' : '#334155'}
                opacity={isHPCFault ? 0.75 : 0.6}
                stroke={isHPCFault ? '#f87171' : 'transparent'}
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="95"
                fill={isHPCFault ? '#fca5a5' : '#94a3b8'}
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                HPC {isHPCFault && '⚠'}
              </text>
            </g>

            {/* 4. Combustor */}
            <g transform="translate(460, 96)">
              <rect x="0" y="0" width="45" height="68" rx="6" fill="url(#combustorGlow)" />
              <rect x="0" y="0" width="45" height="68" rx="6" fill="#f97316" opacity="0.2" />
              <text x="22" y="90" fill="#fdba74" fontSize="8" textAnchor="middle" fontFamily="monospace">
                BURNER
              </text>
            </g>

            {/* 5. HPT Turbine */}
            <g transform="translate(560, 96)">
              <polygon points="0,5 25,0 25,68 0,63" fill="#ea580c" opacity="0.5" />
              <text x="12" y="85" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                HPT
              </text>
            </g>

            {/* 6. LPT Turbine */}
            <g transform="translate(650, 95)">
              <polygon points="0,7 45,0 45,70 0,63" fill="#0284c7" opacity="0.4" />
              <text x="22" y="85" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                LPT
              </text>
            </g>

            {/* Interactive Hotspot Buttons on Schematic */}
            {hotspots.map((h) => {
              const isSelected = selectedComponent === h.id;
              const isAlert = h.status !== 'NOMINAL';
              return (
                <g
                  key={h.id}
                  transform={`translate(${h.x}, ${h.y})`}
                  onClick={() => setSelectedComponent(h.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isSelected ? 16 : 12}
                    fill={isAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.25)'}
                    stroke={isAlert ? '#ef4444' : '#06b6d4'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />
                  <circle
                    r={4}
                    fill={isAlert ? '#ef4444' : '#22d3ee'}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Component Inspector Panel */}
        <div className="mt-4 p-4 rounded-xl bg-avionics-850 border border-avionics-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">{currentComp.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {currentComp.tag}
              </span>
              {currentComp.status !== 'NOMINAL' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  DEGRADATION ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-xl">{currentComp.description}</p>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono bg-avionics-900 px-4 py-2.5 rounded-lg border border-avionics-border">
            <div>
              <span className="text-slate-400 block text-[10px]">LOCAL TEMP</span>
              <span className="text-slate-200 font-bold">{currentComp.temperature}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">LOCAL PRESSURE</span>
              <span className="text-cyan-400 font-bold">{currentComp.pressure}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
