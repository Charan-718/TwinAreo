import React, { useEffect, useRef, useState } from 'react';

interface Fleet3DViewerProps {
  className?: string;
}

/**
 * 3D Future Airliner Digital Twin Model Viewer
 * Embeds the Future Airliner interactive 3D model by Giimann from Sketchfab
 * styled with the Hollywood Hacker HUD digital twin aesthetic.
 * Uses Sketchfab Viewer API to enforce 100% true background transparency
 * that seamlessly adopts the theme background (dark slate or light tactical parchment).
 */
export const Fleet3DViewer: React.FC<Fleet3DViewerProps> = ({ className = '' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (collapsed) return;

    let isMounted = true;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let observer: MutationObserver | null = null;

    const applyThemeColor = (api: any) => {
      if (!api || !api.setBackground) return;
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      // Slate graphite grey (#4c4c4c) in dark mode, light tactical parchment (#f5f4f0) in light mode
      const color = isDark
        ? [76 / 255, 76 / 255, 76 / 255]
        : [245 / 255, 244 / 255, 240 / 255];
      api.setBackground({ color }, () => {
        if (isMounted) setIsLoaded(true);
      });
    };

    const initViewer = () => {
      const iframe = iframeRef.current;
      if (!iframe || !(window as any).Sketchfab) return;

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

      try {
        const client = new (window as any).Sketchfab(iframe);
        client.init('62fdd10d3e004721a29bd47188165ca8', {
          success: (api: any) => {
            if (!isMounted) return;
            apiRef.current = api;
            api.start();

            // Set the theme background color immediately
            applyThemeColor(api);

            api.addEventListener('viewerready', () => {
              if (!isMounted) return;
              applyThemeColor(api);
              setIsLoaded(true);
            });
          },
          error: (err: any) => {
            console.warn('Sketchfab API init warning, falling back:', err);
            if (isMounted) setIsLoaded(true);
          },
          autostart: 1,
          ui_theme: isDark ? 'dark' : 'light',
          ui_infos: 0,
          ui_watermark: 0,
          ui_stop: 0,
          preload: 1,
        });
      } catch (err) {
        console.warn('Sketchfab init exception:', err);
        if (isMounted) setIsLoaded(true);
      }
    };

    // Listen for theme mode changes (dark <-> light toggle) and update 3D viewer background instantly
    observer = new MutationObserver(() => {
      if (apiRef.current) {
        applyThemeColor(apiRef.current);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Safety fallback: if viewerready hasn't fired in 4.5s, reveal the iframe
    fallbackTimer = setTimeout(() => {
      if (isMounted) setIsLoaded(true);
    }, 4500);

    if ((window as any).Sketchfab) {
      initViewer();
    } else {
      let script = document.getElementById('sketchfab-viewer-script') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'sketchfab-viewer-script';
        script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) initViewer();
        };
        script.onerror = () => {
          if (isMounted && iframeRef.current) {
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            iframeRef.current.src = `https://sketchfab.com/models/62fdd10d3e004721a29bd47188165ca8/embed?autostart=1&ui_infos=0&ui_watermark=0&preload=1${isDark ? '&ui_theme=dark' : ''}`;
            setIsLoaded(true);
          }
        };
        document.body.appendChild(script);
      } else {
        script.addEventListener('load', () => {
          if (isMounted) initViewer();
        });
      }
    }

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (observer) observer.disconnect();
    };
  }, [collapsed]);

  return (
    <div className={`cyber-cut-frame mb-6 transition-all duration-normal ${className}`}>
      <div
        className="cyber-cut-inner flex flex-col"
        style={{ background: 'var(--color-bg)' }}
      >
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
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="px-2 py-0.5 text-xs text-primary hover:text-fg hover:bg-surface-interactive border border-line-subtle transition-colors"
              style={{ clipPath: 'var(--clip-badge)' }}
              aria-label={collapsed ? 'Expand 3D model' : 'Collapse 3D model'}
            >
              {collapsed ? '[ + EXPAND_3D ]' : '[ − MINIMIZE ]'}
            </button>
            <span className="hidden sm:inline-block text-[11px] text-fg-muted font-mono">
              [ 3D_VIEWPORT // ACTIVE ]
            </span>
          </div>
        </div>

        {/* 3D Model Iframe Viewport with top-bar clipping to eliminate author dp and title */}
        {!collapsed && (
          <div
            className="relative w-full overflow-hidden flex flex-col"
            style={{ background: 'var(--color-bg)' }}
          >
            {/* Top-corner HUD telemetry pips */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none font-mono text-[10px] text-primary/80 bg-surface/90 px-2 py-1 border border-line-subtle backdrop-blur-xs hidden sm:block shadow-xs" style={{ clipPath: 'var(--clip-badge)' }}>
              <div>SYS//ROTATION: INTERACTIVE 360°</div>
              <div>ORBIT//ZOOM: DRAG / PINCH / SCROLL</div>
            </div>

            <div className="absolute top-3 right-3 z-20 pointer-events-none font-mono text-[10px] text-accent/80 bg-surface/90 px-2 py-1 border border-line-subtle backdrop-blur-xs hidden sm:block shadow-xs" style={{ clipPath: 'var(--clip-badge)' }}>
              <div>TEXTURE//SHADER: LIT_PBR</div>
              <div>AIRFRAME//STATUS: NOMINAL</div>
            </div>

            {/* Sketchfab Embedded 3D Viewer (Shifted up to clip header/avatar & zoomed out for optimal framing) */}
            <div
              className="w-full relative aspect-video min-h-[360px] max-h-[580px] md:h-[480px] lg:h-[520px] overflow-hidden flex items-center justify-center"
              style={{ background: 'var(--color-bg)' }}
            >
              {/* Sleek cyber telemetry loader while PBR mesh & WebGL canvas initialize */}
              {!isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_12px_var(--color-primary)]" />
                  <span className="font-mono text-[11px] text-primary/90 tracking-widest uppercase">
                    [ INITIALIZING_3D_AIRFRAME_TWIN // STREAMING_PBR_MESH... ]
                  </span>
                </div>
              )}

              <iframe
                ref={iframeRef}
                id="sketchfab-airframe-twin"
                title="Future Airliner 3D Digital Twin"
                className={`w-full border-0 absolute left-0 right-0 -top-14 h-[calc(100%+56px)] transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transform: 'scale(0.85)',
                  transformOrigin: '50% 52%',
                  background: 'transparent',
                }}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            {/* Bottom HUD Telemetry Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-surface border-t border-line text-[11px] font-mono text-fg-muted z-10">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">
                  {'// AIRFRAME_SPEC:'}
                </span>
                <span className="text-fg-secondary">
                  FUTURE HYPERSONIC AIRLINER · C-MAPSS FD004 DIGITAL TWIN RIG
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-fg-secondary">
                <span>[MESH: 108.9k TRIANGLES]</span>
                <span>[VERTICES: 59.1k]</span>
                <span className="text-success font-semibold">[STREAM_STABLE // 60 FPS]</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fleet3DViewer;
