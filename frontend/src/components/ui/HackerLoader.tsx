import React, { useEffect, useState, useMemo } from 'react';

export interface HackerLoaderProps {
  progress?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'radar' | 'clipped-rect' | 'hybrid';
  color?: 'theme' | 'primary' | 'cyan' | 'orange' | 'amber';
  className?: string;
}

export const HackerLoader: React.FC<HackerLoaderProps> = ({
  progress,
  label = 'SYSTEM_INITIALIZING // STREAMING_TELEMETRY',
  size = 'md',
  variant = 'radar',
  color = 'theme',
  className = '',
}) => {
  // Track theme (dark mode vs daylight tactical light mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.getAttribute('data-theme') !== 'light';
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    };
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Simulated progress when progress prop is not provided
  const [simulatedProgress, setSimulatedProgress] = useState(12);

  useEffect(() => {
    if (progress !== undefined) return;
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 98) return 98;
        const jump = Math.floor(Math.random() * 8) + 3;
        return Math.min(98, prev + jump);
      });
    }, 180);
    return () => clearInterval(interval);
  }, [progress]);

  const currentPercent = progress !== undefined ? Math.round(progress) : simulatedProgress;

  // Theme-adaptive color palette
  const colorConfig = useMemo(() => {
    if (color === 'theme' || color === 'primary') {
      if (isDark) {
        // Dark mode: Radiant Cyber Yellow from the 3D twin aesthetic
        return {
          main: '#ffff0d',
          glow: 'rgba(255, 255, 13, 0.55)',
          soft: 'rgba(255, 255, 13, 0.18)',
          textClass: 'text-primary',
          borderClass: 'border-primary',
          badgeBg: 'bg-surface-elevated/95',
          barBg: 'bg-surface-sunken/80',
        };
      } else {
        // Light mode: Tactical Amber (#d97706) from light mode token palette
        return {
          main: '#d97706',
          glow: 'rgba(217, 119, 6, 0.45)',
          soft: 'rgba(217, 119, 6, 0.14)',
          textClass: 'text-primary',
          borderClass: 'border-primary',
          badgeBg: 'bg-surface-elevated/95',
          barBg: 'bg-surface-sunken/80',
        };
      }
    }

    switch (color) {
      case 'orange':
      case 'amber':
        return {
          main: isDark ? '#ff7b00' : '#ea580c',
          glow: 'rgba(255, 123, 0, 0.5)',
          soft: 'rgba(255, 123, 0, 0.16)',
          textClass: 'text-accent',
          borderClass: 'border-accent',
          badgeBg: 'bg-surface-elevated/95',
          barBg: 'bg-surface-sunken/80',
        };
      case 'cyan':
        return {
          main: '#00e5ff',
          glow: 'rgba(0, 229, 255, 0.5)',
          soft: 'rgba(0, 229, 255, 0.16)',
          textClass: 'text-[#00e5ff]',
          borderClass: 'border-[#00e5ff]',
          badgeBg: 'bg-surface-elevated/95',
          barBg: 'bg-surface-sunken/80',
        };
      default:
        return isDark
          ? {
              main: '#ffff0d',
              glow: 'rgba(255, 255, 13, 0.55)',
              soft: 'rgba(255, 255, 13, 0.18)',
              textClass: 'text-primary',
              borderClass: 'border-primary',
              badgeBg: 'bg-surface-elevated/95',
              barBg: 'bg-surface-sunken/80',
            }
          : {
              main: '#d97706',
              glow: 'rgba(217, 119, 6, 0.45)',
              soft: 'rgba(217, 119, 6, 0.14)',
              textClass: 'text-primary',
              borderClass: 'border-primary',
              badgeBg: 'bg-surface-elevated/95',
              barBg: 'bg-surface-sunken/80',
            };
    }
  }, [color, isDark]);

  // Unique IDs for SVG gradients and filters to recompute on theme toggle
  const gradientId = useMemo(() => `sweep-grad-${color}-${isDark ? 'dark' : 'light'}`, [color, isDark]);
  const filterId = useMemo(() => `neon-glow-${color}-${isDark ? 'dark' : 'light'}`, [color, isDark]);

  // Size dimensions for the circular radar SVG
  const dim = size === 'sm' ? 68 : size === 'lg' ? 148 : 108;
  const cx = 60;
  const cy = 60;
  const rOuter = 56;
  const rTickInner = 46;
  const rTickOuter = 53;
  const rArc = 48;
  const rInner = 43;

  // Generate 60 radial ticks around the dial (like a cyber radar compass)
  const ticks = useMemo(() => {
    const list = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + rTickInner * Math.cos(rad);
      const y1 = cy + rTickInner * Math.sin(rad);
      const x2 = cx + rTickOuter * Math.cos(rad);
      const y2 = cy + rTickOuter * Math.sin(rad);
      const isMajor = i % 5 === 0;
      list.push({ id: i, x1, y1, x2, y2, isMajor, angle });
    }
    return list;
  }, []);

  const arcCircumference = 2 * Math.PI * rArc;
  const arcDashOffset = arcCircumference * (1 - currentPercent / 100);

  // Render the circular radar dial loader
  const renderRadarDial = () => (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 120 120"
        width={dim}
        height={dim}
        className="block select-none overflow-visible"
        style={{ filter: `drop-shadow(0 0 10px ${colorConfig.glow})` }}
      >
        <defs>
          {/* Radar sweeping beam sector gradient */}
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colorConfig.main} stopOpacity="0.45" />
            <stop offset="65%" stopColor={colorConfig.main} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colorConfig.main} stopOpacity="0" />
          </radialGradient>

          {/* Glow filter */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Outer Thin Dial Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          fill="none"
          stroke={colorConfig.main}
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Outer dashed tracker ring (slow reverse rotate) */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter + 2}
          fill="none"
          stroke={colorConfig.main}
          strokeWidth="0.8"
          strokeDasharray="4 8"
          opacity="0.45"
          className="animate-[spin_12s_linear_infinite_reverse] origin-center"
        />

        {/* 2. Concentric Radial Tick Marks */}
        <g opacity="0.65">
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={colorConfig.main}
              strokeWidth={t.isMajor ? 1.4 : 0.8}
              opacity={t.isMajor ? 0.95 : 0.4}
            />
          ))}
        </g>

        {/* 3. Inner Circle Frame */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="none"
          stroke={colorConfig.main}
          strokeWidth="1.2"
          opacity="0.75"
        />

        {/* 4. Rotating Radar Sweep Beam Cone */}
        <g className="animate-[spin_2.8s_linear_infinite] origin-center">
          {/* Sweeping pie-sector wedge (~40 degrees) */}
          <path
            d={`M ${cx} ${cy} L ${cx + rInner * Math.cos(-Math.PI / 4)} ${
              cy + rInner * Math.sin(-Math.PI / 4)
            } A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy} Z`}
            fill={`url(#${gradientId})`}
            opacity="0.85"
          />
          {/* Leading beam edge ray with strong glow */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + rInner}
            y2={cy}
            stroke={colorConfig.main}
            strokeWidth="1.8"
            opacity="0.95"
            style={{ filter: `drop-shadow(0 0 4px ${colorConfig.main})` }}
          />
        </g>

        {/* 5. Active Progress Arc (Glowing arc) */}
        <circle
          cx={cx}
          cy={cy}
          r={rArc}
          fill="none"
          stroke={colorConfig.main}
          strokeWidth="3.2"
          strokeDasharray={arcCircumference}
          strokeDashoffset={arcDashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={`url(#${filterId})`}
          className="transition-all duration-300 ease-out"
        />

        {/* 6. Precision Crosshair Ticks at cardinal axes */}
        <line x1={cx - rOuter - 3} y1={cy} x2={cx - rOuter} y2={cy} stroke={colorConfig.main} strokeWidth="1.5" />
        <line x1={cx + rOuter} y1={cy} x2={cx + rOuter + 3} y2={cy} stroke={colorConfig.main} strokeWidth="1.5" />
        <line x1={cx} y1={cy - rOuter - 3} x2={cx} y2={cy - rOuter} stroke={colorConfig.main} strokeWidth="1.5" />
        <line x1={cx} y1={cy + rOuter} x2={cx} y2={cy + rOuter + 3} stroke={colorConfig.main} strokeWidth="1.5" />
      </svg>

      {/* 7. Center Percentage Readout (Crisp Monospace Cyber Typography) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span
          className="font-display font-bold leading-none tracking-tight transition-all duration-150 tabular"
          style={{
            color: colorConfig.main,
            fontSize: size === 'sm' ? '14px' : size === 'lg' ? '30px' : '22px',
            textShadow: `0 0 12px ${colorConfig.glow}`,
          }}
        >
          {currentPercent}%
        </span>
      </div>
    </div>
  );

  // Render the clipped-path rectangle loader
  const renderClippedRect = () => (
    <div
      className={`relative p-3.5 bg-surface/90 backdrop-blur-md border ${colorConfig.borderClass} max-w-sm w-full select-none shadow-[0_0_24px_${colorConfig.glow}]`}
      style={{ clipPath: 'var(--clip-cut-corner)' }}
    >
      {/* Corner crosshair brackets */}
      <div className="absolute top-1 left-1.5 font-mono text-[9px] text-fg-muted pointer-events-none">[+]</div>
      <div className="absolute top-1 right-1.5 font-mono text-[9px] text-fg-muted pointer-events-none">[+]</div>
      <div className="absolute bottom-1 left-1.5 font-mono text-[9px] text-fg-muted pointer-events-none">[+]</div>
      <div className="absolute bottom-1 right-1.5 font-mono text-[9px] text-fg-muted pointer-events-none">[+]</div>

      <div className="flex items-center justify-between mb-2 font-mono text-[10px] tracking-wider uppercase">
        <span className={`font-bold flex items-center gap-1.5 ${colorConfig.textClass}`}>
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: colorConfig.main }} />
          [ STREAMING_TELEMETRY ]
        </span>
        <span className="font-display font-bold text-xs tabular" style={{ color: colorConfig.main }}>
          {currentPercent}%
        </span>
      </div>

      {/* Segmented Loading Bar with Laser Sweep */}
      <div className={`relative h-3 w-full ${colorConfig.barBg} border border-line overflow-hidden p-0.5`}>
        {/* Progress fill */}
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${currentPercent}%`,
            background: `linear-gradient(90deg, ${colorConfig.soft}, ${colorConfig.main})`,
            boxShadow: `0 0 12px ${colorConfig.glow}`,
          }}
        />

        {/* Laser scanner line passing across */}
        <div
          className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[laser-sweep_1.6s_ease-in-out_infinite] pointer-events-none"
          style={{ opacity: 0.85 }}
        />
      </div>

      {label && (
        <div className="mt-2 text-center font-mono text-[10px] text-fg-muted tracking-widest truncate uppercase">
          {label}
        </div>
      )}
    </div>
  );

  // Render hybrid: circular radar dial housed inside a clipped-corner HUD chassis
  if (variant === 'clipped-rect') {
    return <div className={`flex flex-col items-center justify-center ${className}`}>{renderClippedRect()}</div>;
  }

  if (variant === 'hybrid') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-5 bg-surface/90 backdrop-blur-md border ${colorConfig.borderClass} clip-cut-corner select-none shadow-[0_0_30px_${colorConfig.glow}] ${className}`}
        style={{ clipPath: 'var(--clip-cut-corner)' }}
      >
        {/* Corner tags */}
        <div className="w-full flex items-center justify-between font-mono text-[10px] text-fg-muted mb-3 border-b border-line pb-1.5">
          <span className="flex items-center gap-1.5 font-bold" style={{ color: colorConfig.main }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colorConfig.main }} />
            NASA_C-MAPSS // TELEMETRY_LOCK
          </span>
          <span>SYS//PBR_SHADER</span>
        </div>

        {renderRadarDial()}

        {label && (
          <div className="mt-3 text-center font-mono text-[11px] tracking-widest uppercase flex items-center gap-2" style={{ color: colorConfig.main }}>
            <span>[</span>
            <span className="text-fg-secondary font-medium tracking-wider">{label}</span>
            <span>]</span>
          </div>
        )}
      </div>
    );
  }

  // Default 'radar' variant matching user reference image
  return (
    <div className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}>
      {renderRadarDial()}
      {label && (
        <div
          className="text-center font-mono text-[10px] sm:text-[11px] tracking-widest uppercase flex items-center gap-1.5"
          style={{ color: colorConfig.main, textShadow: `0 0 8px ${colorConfig.glow}` }}
        >
          <span className="opacity-70">[</span>
          <span className="text-fg-secondary tracking-wider">{label}</span>
          <span className="opacity-70">]</span>
        </div>
      )}
    </div>
  );
};
