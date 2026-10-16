import React, { useState } from 'react';
import { Icon } from '../ui/Icon';

interface Fleet3DViewerProps {
  className?: string;
}

/**
 * 3D Future Airliner Digital Twin Model Viewer
 * Embeds the Future Airliner interactive 3D model by Giimann from Sketchfab
 * styled with the Hollywood Hacker HUD digital twin aesthetic.
 */
export const Fleet3DViewer: React.FC<Fleet3DViewerProps> = ({ className = '' }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`cyber-cut-frame mb-6 transition-all duration-normal ${className}`}>
      <div className="cyber-cut-inner bg-surface-sunken flex flex-col">
        {/* HUD Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-elevated border-b border-line text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
            <span className="font-display font-bold tracking-wider text-fg uppercase">
              {'[ 3D_AIRFRAME_TWIN // LIVE_TELEMETRY ]'}
            </span>
            <span className="hidden sm:inline-block text-[11px] text-primary/80 border border-primary/30 px-1.5 py-0.5" style={{ clipPath: 'var(--clip-badge)' }}>
              FUTURE AIRLINER // NASA C-MAPSS FD004 CARRIER
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-fg-muted text-[11px]">
              {'// MODEL: GIIMANN'}
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="px-2 py-0.5 text-xs text-primary hover:text-fg hover:bg-surface-interactive border border-line-subtle transition-colors"
              style={{ clipPath: 'var(--clip-badge)' }}
              aria-label={collapsed ? 'Expand 3D model' : 'Collapse 3D model'}
            >
              {collapsed ? '[ + EXPAND_3D ]' : '[ − MINIMIZE ]'}
            </button>
            <a
              href="https://sketchfab.com/3d-models/future-airliner-62fdd10d3e004721a29bd47188165ca8"
              target="_blank"
              rel="noreferrer nofollow"
              className="hidden lg:inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              title="Open source model on Sketchfab"
            >
              [ SKETCHFAB <Icon name="chevronRight" size={12} /> ]
            </a>
          </div>
        </div>

        {/* 3D Model Iframe Viewport */}
        {!collapsed && (
          <div className="relative w-full overflow-hidden bg-black/80 flex flex-col">
            {/* Top-corner HUD telemetry pips */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none font-mono text-[10px] text-primary/70 bg-surface/80 px-2 py-1 border border-line-subtle backdrop-blur-xs hidden sm:block" style={{ clipPath: 'var(--clip-badge)' }}>
              <div>SYS//ROTATION: INTERACTIVE 360°</div>
              <div>ORBIT//ZOOM: DRAG / PINCH / SCROLL</div>
            </div>

            <div className="absolute top-3 right-3 z-10 pointer-events-none font-mono text-[10px] text-accent/80 bg-surface/80 px-2 py-1 border border-line-subtle backdrop-blur-xs hidden sm:block" style={{ clipPath: 'var(--clip-badge)' }}>
              <div>TEXTURE//SHADER: LIT_PBR</div>
              <div>AIRFRAME//STATUS: NOMINAL</div>
            </div>

            {/* Sketchfab Embedded 3D Viewer */}
            <div className="w-full relative aspect-video min-h-[320px] max-h-[500px] md:h-[420px] lg:h-[460px]">
              <iframe
                title="Future Airliner 3D Digital Twin"
                className="w-full h-full border-0"
                src="https://sketchfab.com/models/62fdd10d3e004721a29bd47188165ca8/embed?autostart=1&ui_theme=dark&preload=1"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            {/* Bottom HUD Telemetry Status & Attribution Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-surface border-t border-line text-[11px] font-mono text-fg-muted">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">
                  {'// ATTRIBUTION:'}
                </span>
                <span>
                  <a
                    href="https://sketchfab.com/3d-models/future-airliner-62fdd10d3e004721a29bd47188165ca8"
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="text-primary hover:underline font-semibold"
                  >
                    Future Airliner
                  </a>{' '}
                  by{' '}
                  <a
                    href="https://sketchfab.com/giimann"
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="text-primary hover:underline font-semibold"
                  >
                    Giimann
                  </a>{' '}
                  on{' '}
                  <a
                    href="https://sketchfab.com"
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="text-primary hover:underline"
                  >
                    Sketchfab
                  </a>
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-fg-secondary">
                <span>[MESH: 108.9k TRIANGLES]</span>
                <span>[VERTICES: 59.1k]</span>
                <span className="text-success font-semibold">[READY // 60 FPS]</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fleet3DViewer;
