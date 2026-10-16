import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { HackerLoader } from '../ui/HackerLoader';

interface DroneViewer3DProps {
  className?: string;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

type DroneMode = 'docked' | 'free' | 'patrol' | 'center';

export const DroneViewer3D: React.FC<DroneViewer3DProps> = ({ className = '', onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Position & Drag state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Default initial position placed at the navbar: top right area
    const initialX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 380) : 400;
    return { x: initialX, y: 6 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });

  // 3D Canvas rotation interaction state
  const isRotatingRef = useRef(false);
  const rotStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const modelRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: -0.6 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: -0.6 });
  const zoomRef = useRef<number>(5.5);

  // UI state
  const [mode, setMode] = useState<DroneMode>('docked');
  const [compact, setCompact] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rpm, setRpm] = useState(8400);

  // Patrol animation state
  const patrolTimeRef = useRef(0);

  // Recalculate navbar dock position
  const getNavbarPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 400, y: 6 };
    // Position right above or at navbar, between brand and right controls
    const w = window.innerWidth;
    if (w < 640) {
      return { x: Math.max(8, w - 210), y: 4 };
    }
    // Centered or docked toward right side of navbar
    return { x: Math.max(16, w - 380), y: 6 };
  }, []);

  // Snap to Navbar
  const dockToNavbar = useCallback(() => {
    const navPos = getNavbarPosition();
    setPosition(navPos);
    setMode('docked');
    setCompact(false);
    onPositionChange?.(navPos);
  }, [getNavbarPosition, onPositionChange]);

  // Center on Screen
  const centerOnScreen = useCallback(() => {
    if (typeof window === 'undefined') return;
    const widgetWidth = compact ? 180 : 320;
    const widgetHeight = compact ? 120 : 220;
    const centered = {
      x: Math.max(10, Math.round((window.innerWidth - widgetWidth) / 2)),
      y: Math.max(10, Math.round((window.innerHeight - widgetHeight) / 2)),
    };
    setPosition(centered);
    setMode('center');
    onPositionChange?.(centered);
  }, [compact, onPositionChange]);

  // Handle window resize to keep drone inside viewport
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => {
        const widgetW = compact ? 180 : 300;
        const widgetH = compact ? 120 : 200;
        const maxX = Math.max(0, window.innerWidth - widgetW);
        const maxY = Math.max(0, window.innerHeight - widgetH);
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [compact]);

  // Pointer drag logic for moving the drone throughout the viewport
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging if clicked on an action button or inside 3D canvas
    if ((e.target as HTMLElement).closest('button, canvas, a')) return;
    setIsDragging(true);
    setMode('free');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;
    const widgetW = compact ? 180 : 300;
    const widgetH = compact ? 120 : 200;
    const maxX = Math.max(0, window.innerWidth - widgetW);
    const maxY = Math.max(0, window.innerHeight - widgetH);

    const newX = Math.min(Math.max(0, dragStartRef.current.posX + deltaX), maxX);
    const newY = Math.min(Math.max(0, dragStartRef.current.posY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
    onPositionChange?.({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // 3D Canvas orbit rotation handling
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    isRotatingRef.current = true;
    rotStartRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isRotatingRef.current) return;
    e.stopPropagation();
    const deltaX = e.clientX - rotStartRef.current.x;
    const deltaY = e.clientY - rotStartRef.current.y;
    rotStartRef.current = { x: e.clientX, y: e.clientY };

    targetRotationRef.current.y += deltaX * 0.015;
    targetRotationRef.current.x = Math.max(
      -Math.PI / 2.5,
      Math.min(Math.PI / 2.5, targetRotationRef.current.x + deltaY * 0.015)
    );
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isRotatingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    zoomRef.current = Math.max(3.0, Math.min(9.0, zoomRef.current + e.deltaY * 0.005));
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  };

  const reset3DRotation = () => {
    targetRotationRef.current = { x: 0.25, y: -0.6 };
    zoomRef.current = 5.5;
    if (cameraRef.current) cameraRef.current.position.z = 5.5;
  };

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isSubscribed = true;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const width = canvas.clientWidth || 280;
    const height = canvas.clientHeight || 150;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, zoomRef.current);
    cameraRef.current = camera;

    // 3. Renderer with transparent background & antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 4. Lights: Tactical Hollywood Hacker Aerospace illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    // TwinAero Cyber Yellow rim light
    const yellowRim = new THREE.PointLight(0xffff0d, 3.5, 15);
    yellowRim.position.set(-4, -2, 4);
    scene.add(yellowRim);

    // Cyan tactical under-glow light
    const cyanLight = new THREE.PointLight(0x00e5ff, 2.0, 15);
    cyanLight.position.set(4, -3, -4);
    scene.add(cyanLight);

    // 5. Load GLTF model (/drone.glb)
    const loader = new GLTFLoader();
    const modelUrl = `${process.env.PUBLIC_URL || ''}/drone.glb`;

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isSubscribed) return;

        const model = gltf.scene;
        modelRef.current = model;

        // Calculate bounding box and center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the geometry
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Create an anchor parent to hold rotation and position transforms
        const anchor = new THREE.Group();
        anchor.add(model);

        // Normalize scale to fit nicely in the viewport
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 3.2 / (maxDim || 1);
        anchor.scale.setScalar(targetScale);

        scene.add(anchor);

        // Play animations (spinning rotor propellers)
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
        }

        setIsLoading(false);
      },
      undefined,
      (error) => {
        if (!isSubscribed) return;
        console.error('Failed to load drone.glb model:', error);
        setLoadError('Failed to load 3D drone asset');
        setIsLoading(false);
      }
    );

    // 6. Animation render loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update propeller animations
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Smooth camera position for zoom
      if (cameraRef.current) {
        cameraRef.current.position.z += (zoomRef.current - cameraRef.current.position.z) * 0.1;
      }

      // Interpolate smooth rotation towards target
      modelRotationRef.current.x += (targetRotationRef.current.x - modelRotationRef.current.x) * 0.1;
      modelRotationRef.current.y += (targetRotationRef.current.y - modelRotationRef.current.y) * 0.1;

      // Autopilot subtle spin when not manually rotating
      if (!isRotatingRef.current) {
        targetRotationRef.current.y += 0.003;
      }

      // Subtle realistic aerial drone hover oscillation & banking
      if (scene.children.length > 0) {
        const droneGroup = scene.children.find((c) => c instanceof THREE.Group) as THREE.Group | undefined;
        if (droneGroup) {
          droneGroup.rotation.x = modelRotationRef.current.x + Math.sin(time * 2.2) * 0.03;
          droneGroup.rotation.y = modelRotationRef.current.y;
          droneGroup.rotation.z = Math.sin(time * 1.6) * 0.04;
          droneGroup.position.y = Math.sin(time * 2.5) * 0.08;
        }
      }

      // Render frame
      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Observer for dynamic canvas sizing
    const resizeObserver = new ResizeObserver(() => {
      if (!canvas || !renderer || !camera) return;
      const w = canvas.clientWidth || 280;
      const h = canvas.clientHeight || 150;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Viewport patrol / roam mode handling
  useEffect(() => {
    if (mode !== 'patrol') return;

    let patrolAnimId: number;
    const patrolSpeed = 0.0008;

    const runPatrol = () => {
      patrolTimeRef.current += patrolSpeed;
      const t = patrolTimeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const widgetW = compact ? 180 : 280;
      const widgetH = compact ? 120 : 180;

      // Smooth Lissajous curve around the viewport
      const padding = 20;
      const usableW = Math.max(10, w - widgetW - padding * 2);
      const usableH = Math.max(10, h - widgetH - padding * 2);

      const x = padding + (Math.sin(t * 1.5) * 0.5 + 0.5) * usableW;
      const y = padding + (Math.cos(t * 2.1) * 0.5 + 0.5) * usableH;

      setPosition({ x: Math.round(x), y: Math.round(y) });
      patrolAnimId = requestAnimationFrame(runPatrol);
    };

    patrolAnimId = requestAnimationFrame(runPatrol);
    return () => cancelAnimationFrame(patrolAnimId);
  }, [mode, compact]);

  // Fluctuating RPM for live telemetry effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRpm(8350 + Math.floor(Math.random() * 120));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-[9999] select-none transition-shadow ${
        compact ? 'w-[180px]' : 'w-[280px] sm:w-[320px]'
      } ${isDragging ? 'cursor-grabbing opacity-95 scale-[1.02]' : 'cursor-grab'} ${className}`}
    >
      {/* ─── CYBER DRONE HOLLYWOOD HACKER HUD CHASSIS ─── */}
      <div className="relative rounded-none border border-primary/50 bg-surface/90 backdrop-blur-md shadow-[0_0_24px_rgba(255,255,13,0.3)] clip-cut-corner text-fg overflow-hidden">
        {/* Glowing cyber yellow tech banner */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface-elevated/95 border-b border-primary/40 font-mono text-[10px] tracking-wider uppercase">
          <div className="flex items-center gap-1.5 text-primary font-bold truncate">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse shadow-[0_0_6px_#ffff0d]" />
            <span className="tracking-[0.14em] truncate">
              {compact ? 'DRONE // AIRBORNE' : 'DRONE_TWIN // ESCORT'}
            </span>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Snap back to navbar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dockToNavbar();
              }}
              title="Dock to Navbar"
              className={`px-1 py-0.5 clip-cut-btn text-[9px] border font-mono transition-colors ${
                mode === 'docked'
                  ? 'border-primary bg-primary text-black font-bold'
                  : 'border-line text-fg-secondary hover:text-primary hover:border-primary/60'
              }`}
            >
              NAV
            </button>

            {/* Viewport Patrol Mode */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMode((prev) => (prev === 'patrol' ? 'free' : 'patrol'));
              }}
              title="Toggle Viewport Patrol"
              className={`px-1 py-0.5 clip-cut-btn text-[9px] border font-mono transition-colors ${
                mode === 'patrol'
                  ? 'border-accent bg-accent text-black font-bold animate-pulse'
                  : 'border-line text-fg-secondary hover:text-accent hover:border-accent/60'
              }`}
            >
              PATROL
            </button>

            {/* Compact / Expand Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCompact(!compact);
              }}
              title={compact ? 'Expand HUD' : 'Compact Drone'}
              className="px-1 py-0.5 clip-cut-btn text-[9px] border border-line text-fg-secondary hover:text-primary hover:border-primary/60 font-mono"
            >
              {compact ? '+' : '−'}
            </button>
          </div>
        </div>

        {/* ─── 3D THREE.JS WEBGL DRONE CANVAS ─── */}
        <div className="relative w-full h-[120px] sm:h-[145px] bg-gradient-to-b from-transparent via-primary/5 to-surface-sunken/40 cursor-grab active:cursor-grabbing overflow-hidden">
          {/* Subtle radar sweep animation overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent"
            aria-hidden="true"
          />

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-surface/90 backdrop-blur-xs z-10">
              <HackerLoader size="sm" color="theme" label="INIT_DRONE_3D" />
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center font-mono text-[10px] text-danger bg-surface/90 z-10">
              <span>[!] {loadError}</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onWheel={handleCanvasWheel}
            className="w-full h-full block"
            title="Drag to rotate 3D drone | Scroll to zoom"
          />

          {/* Micro HUD Overlay */}
          <div className="absolute bottom-1 left-2 pointer-events-none font-mono text-[9px] text-primary/80 flex items-center gap-2">
            <span>[3D_ORBIT: DRAG]</span>
            <span className="text-fg-muted">|</span>
            <span className="hidden sm:inline text-fg-muted">[ZOOM: SCROLL]</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset3DRotation();
            }}
            title="Reset 3D Drone Orientation"
            className="absolute bottom-1 right-2 pointer-events-auto px-1.5 py-0.5 clip-cut-btn text-[9px] font-mono border border-line bg-surface/80 text-fg-secondary hover:text-primary hover:border-primary/50 transition-colors"
          >
            RESET_3D
          </button>
        </div>

        {/* ─── TELEMETRY HUD FOOTER (Shown when expanded) ─── */}
        {!compact && (
          <div className="p-2 border-t border-line/60 bg-surface-sunken/80 font-mono text-[10px] space-y-1">
            <div className="flex items-center justify-between text-fg-secondary">
              <span className="text-primary/70">VIEWPORT_LOC:</span>
              <span className="text-primary tabular">
                X:{Math.round(position.x)} | Y:{Math.round(position.y)}
              </span>
            </div>
            <div className="flex items-center justify-between text-fg-secondary">
              <span className="text-primary/70">PROPULSION:</span>
              <span className="text-success tabular">{rpm.toLocaleString()} RPM</span>
            </div>
            <div className="flex items-center justify-between text-fg-secondary">
              <span className="text-primary/70">FLIGHT_MODE:</span>
              <span className="text-accent uppercase">
                {mode === 'docked' ? 'NAVBAR_STATION' : mode === 'patrol' ? 'AUTONOMOUS_PATROL' : 'VIEWPORT_ROAM'}
              </span>
            </div>

            {/* Viewport Navigation Actions */}
            <div className="pt-1.5 flex items-center justify-between gap-1.5 border-t border-line/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dockToNavbar();
                }}
                className="flex-1 py-0.5 clip-cut-btn text-[9px] text-center border border-primary/50 text-primary hover:bg-primary/20 transition-colors"
              >
                [ DOCK_NAV ]
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  centerOnScreen();
                }}
                className="flex-1 py-0.5 clip-cut-btn text-[9px] text-center border border-line text-fg-secondary hover:text-primary hover:border-primary transition-colors"
              >
                [ CENTER ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
