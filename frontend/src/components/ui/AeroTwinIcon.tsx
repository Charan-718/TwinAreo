import React from 'react';

export interface AeroTwinIconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
  variant?: 'auto' | 'dark' | 'light';
}

/**
 * AeroTwin / TwinAero Hybrid Dual-Themed Icon:
 * - Dark Mode: Radiant All-Gold Icon (Lustrous Solid Metallic Gold physical aircraft on the left,
 *   Holographic Solar Gold wireframe digital twin on the right).
 * - Light Mode: Sleek Technical Titanium Slate Grey (Solid Dark Titanium on the left,
 *   Silver Grey Wireframe digital twin on the right).
 * - Automatically responds to `[data-theme="dark"]` vs `[data-theme="light"]` or can be forced via `variant`.
 */
export const AeroTwinIcon: React.FC<AeroTwinIconProps> = ({
  width = '100%',
  height = '100%',
  className = '',
  variant = 'auto',
  ...props
}) => {
  const showDark = variant === 'dark' || variant === 'auto';
  const showLight = variant === 'light' || variant === 'auto';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      width={width}
      height={height}
      fill="none"
      className={`aerotwin-icon ${className}`}
      {...props}
    >
      <style>{`
        ${
          variant === 'auto'
            ? `
          :root[data-theme="light"] .at-layer-dark { display: none !important; }
          :root[data-theme="light"] .at-layer-light { display: inline !important; }
          :root[data-theme="dark"] .at-layer-light { display: none !important; }
          :root[data-theme="dark"] .at-layer-dark { display: inline !important; }
          :root:not([data-theme="light"]) .at-layer-light { display: none; }
          :root:not([data-theme="light"]) .at-layer-dark { display: inline; }
        `
            : ''
        }
      `}</style>

      <defs>
        {/* ════════ DARK GOLD DEFS ════════ */}
        <filter id="at-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="at-gold-node-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="at-gold-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Physical Metallic Gold Gradient (Left Aircraft) */}
        <linearGradient id="at-gold-phys-grad" x1="30" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="25%" stopColor="#d97706" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#ffd000" />
        </linearGradient>

        <linearGradient id="at-gold-phys-specular" x1="120" y1="165" x2="380" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff1a8" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="at-gold-frame-left" x1="215" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#ffb703" />
        </linearGradient>

        <linearGradient id="at-gold-gradient" x1="400" y1="50" x2="780" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffd000" />
          <stop offset="50%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#ff7b00" />
        </linearGradient>

        <linearGradient id="at-split-gold-grad" x1="400" y1="40" x2="400" y2="365" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffd000" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#ffb703" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff7b00" stopOpacity="0.5" />
        </linearGradient>

        <radialGradient id="at-gold-radial-bg" cx="520" cy="180" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb703" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#ff7b00" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ff7b00" stopOpacity="0" />
        </radialGradient>

        {/* ════════ LIGHT GREY DEFS ════════ */}
        <filter id="at-grey-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#475569" floodOpacity="0.25" />
        </filter>

        <filter id="at-grey-node-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="1.5" floodColor="#1e293b" floodOpacity="0.3" />
        </filter>

        <linearGradient id="at-grey-gradient" x1="400" y1="50" x2="780" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="at-titanium-slate-grad" x1="50" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="at-split-grey-grad" x1="400" y1="40" x2="400" y2="365" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.6" />
          <stop offset="35%" stopColor="#64748b" stopOpacity="1" />
          <stop offset="70%" stopColor="#94a3b8" stopOpacity="1" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
        </linearGradient>

        <radialGradient id="at-grey-radial-bg" cx="520" cy="180" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.1" />
          <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ══════════════════════════════════════════════════════════════
           DARK MODE: ALL-GOLD ICON (SOLID GOLD LEFT + WIREFRAME GOLD RIGHT)
           ══════════════════════════════════════════════════════════════ */}
      {showDark && (
        <g className="at-layer-dark">
          <ellipse cx="520" cy="200" rx="220" ry="120" fill="url(#at-gold-radial-bg)" pointerEvents="none" />

          {/* Left Rhombus Frame: Burnished Gold */}
          <polyline
            points="400,38 215,200 400,362"
            fill="none"
            stroke="url(#at-gold-frame-left)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="400,38 215,200 400,362"
            fill="none"
            stroke="#ffd000"
            strokeWidth="1.25"
            strokeOpacity="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="345" cy="85" r="3.5" fill="#ffd000" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="290" cy="133" r="4" fill="#ffb703" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="240" cy="178" r="3.5" fill="#ffb703" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="255" cy="235" r="4" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="305" cy="278" r="3.5" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="355" cy="322" r="3" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />

          {/* Right Rhombus Frame: Glowing Gold Conduit */}
          <polyline
            points="400,38 585,200 400,362"
            fill="none"
            stroke="url(#at-gold-gradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#at-gold-glow)"
          />
          <polyline
            points="400,38 585,200 400,362"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Circuit Frame Nodes */}
          <g filter="url(#at-gold-node-glow)">
            <circle cx="455" cy="85" r="4.5" fill="#ffffff" stroke="#ffd000" strokeWidth="2" />
            <circle cx="510" cy="133" r="5" fill="#ffffff" stroke="#ffb703" strokeWidth="2.5" />
            <circle cx="560" cy="178" r="4.5" fill="#ffffff" stroke="#ffb703" strokeWidth="2" />
            <circle cx="545" cy="235" r="5" fill="#ffffff" stroke="#ff7b00" strokeWidth="2" />
            <circle cx="495" cy="278" r="4.5" fill="#ffffff" stroke="#ff7b00" strokeWidth="2" />
            <circle cx="445" cy="322" r="4" fill="#ffffff" stroke="#ff7b00" strokeWidth="2" />
          </g>

          {/* Traces */}
          <g stroke="#ffb703" strokeWidth="2" fill="none" filter="url(#at-gold-glow)" strokeLinejoin="round" strokeLinecap="round">
            <polyline points="440,75 440,115 500,115" />
            <polyline points="500,115 520,135 520,165" />
            <polyline points="520,135 570,135 595,160" />
            <polyline points="575,250 600,235 635,235" />
            <polyline points="635,235 660,260 700,260" />
            <polyline points="660,260 645,280 670,295" />
            <polyline points="745,178 755,200 770,200" />
          </g>

          <g filter="url(#at-gold-node-glow)">
            <circle cx="440" cy="115" r="3.5" fill="#ffd000" />
            <circle cx="500" cy="115" r="4" fill="#ffffff" stroke="#ffd000" strokeWidth="2" />
            <circle cx="520" cy="165" r="4.5" fill="#ffffff" stroke="#ffb703" strokeWidth="2" />
            <circle cx="570" cy="135" r="4" fill="#ffd000" />
            <circle cx="595" cy="160" r="5" fill="#ffffff" stroke="#ffb703" strokeWidth="2" />
            <circle cx="600" cy="235" r="3.5" fill="#ffb703" />
            <circle cx="635" cy="235" r="4" fill="#ffffff" stroke="#ffb703" strokeWidth="2" />
            <circle cx="700" cy="260" r="5" fill="#ffffff" stroke="#ff7b00" strokeWidth="2" />
            <circle cx="670" cy="295" r="4.5" fill="#ffffff" stroke="#ff7b00" strokeWidth="2" />
            <circle cx="770" cy="200" r="3.5" fill="#ffffff" stroke="#ffd000" strokeWidth="2" />
          </g>

          {/* Left Wing (Solid Lustrous Metallic Gold Physical Aircraft) */}
          <g fill="url(#at-gold-phys-grad)">
            <polygon points="400,68 386,138 400,138" />
            <polygon points="400,165 350,172 30,162 22,175 140,195 220,210 310,225 350,238 400,248" />
            <polygon points="350,172 170,188 320,208 350,195" fill="var(--color-bg, #4c4c4c)" />
            <polygon points="348,172 200,186 315,202 348,192" fill="url(#at-gold-phys-specular)" />
            <polygon points="400,126 338,172 368,228 400,274" />
            <polygon points="396,140 354,172 376,210 396,210" fill="var(--color-bg, #4c4c4c)" />
            <polygon points="362,175 325,225 355,232 388,185" fill="#d97706" />
            <rect x="345" y="252" width="6" height="34" rx="2" fill="#d97706" />
            <rect x="333" y="278" width="12" height="22" rx="4" fill="#ffd000" stroke="#b45309" strokeWidth="1.2" />
            <rect x="353" y="278" width="12" height="22" rx="4" fill="#ffd000" stroke="#b45309" strokeWidth="1.2" />
            <rect x="339" y="284" width="20" height="6" rx="2" fill="#b45309" />
            <circle cx="339" cy="289" r="2.5" fill="var(--color-bg, #4c4c4c)" />
            <circle cx="359" cy="289" r="2.5" fill="var(--color-bg, #4c4c4c)" />
            <circle cx="248" cy="242" r="27" fill="url(#at-gold-phys-grad)" stroke="#ffd000" strokeWidth="2" />
            <circle cx="248" cy="242" r="23" fill="var(--color-bg, #4c4c4c)" />
            <circle cx="248" cy="242" r="14" fill="#d97706" />
            <circle cx="248" cy="242" r="6" fill="#ffd000" />
            <ellipse cx="145" cy="216" rx="13" ry="16" fill="url(#at-gold-phys-grad)" stroke="#ffd000" strokeWidth="1" />
            <ellipse cx="88" cy="195" rx="10" ry="13" fill="url(#at-gold-phys-grad)" stroke="#ffd000" strokeWidth="1" />
          </g>
          <line x1="30" y1="162" x2="400" y2="165" stroke="#fff4a3" strokeWidth="1.5" strokeLinecap="round" />

          {/* Right Digital Twin Wireframe (Gold) */}
          <g stroke="#ffb703" strokeWidth="1.5" fill="none" filter="url(#at-gold-glow)">
            <polygon points="400,68 414,138 400,138" fill="rgba(255, 183, 3, 0.08)" />
            <line x1="400" y1="92" x2="408" y2="138" />
            <line x1="400" y1="115" x2="414" y2="138" />
            <line x1="400" y1="68" x2="407" y2="105" />
          </g>
          <g stroke="#ffb703" strokeWidth="1.75" fill="none" filter="url(#at-gold-glow)">
            <polygon points="400,165 450,172 770,162 778,175 660,195 580,210 490,225 450,238 400,248" fill="rgba(255, 183, 3, 0.06)" />
            <line x1="450" y1="172" x2="450" y2="238" strokeWidth="1.5" />
            <line x1="510" y1="171" x2="500" y2="223" strokeWidth="1.5" />
            <line x1="575" y1="169" x2="565" y2="212" strokeWidth="1.5" />
            <line x1="640" y1="167" x2="630" y2="201" strokeWidth="1.5" />
            <line x1="705" y1="165" x2="695" y2="188" strokeWidth="1.5" />
            <line x1="400" y1="202" x2="774" y2="169" strokeWidth="1.25" strokeDasharray="6 3" />
            <line x1="450" y1="172" x2="500" y2="223" strokeWidth="1.2" opacity="0.85" />
            <line x1="510" y1="171" x2="450" y2="238" strokeWidth="1.2" opacity="0.85" />
            <line x1="510" y1="171" x2="565" y2="212" strokeWidth="1.2" opacity="0.85" />
            <line x1="575" y1="169" x2="500" y2="223" strokeWidth="1.2" opacity="0.85" />
            <line x1="575" y1="169" x2="630" y2="201" strokeWidth="1.2" opacity="0.85" />
            <line x1="640" y1="167" x2="565" y2="212" strokeWidth="1.2" opacity="0.85" />
            <line x1="640" y1="167" x2="695" y2="188" strokeWidth="1.2" opacity="0.85" />
            <line x1="705" y1="165" x2="630" y2="201" strokeWidth="1.2" opacity="0.85" />
            <line x1="705" y1="165" x2="778" y2="175" strokeWidth="1.2" opacity="0.85" />
            <line x1="770" y1="162" x2="695" y2="188" strokeWidth="1.2" opacity="0.85" />
            <polygon points="452,172 600,186 485,202 452,192" fill="rgba(255, 123, 0, 0.16)" stroke="#ff7b00" strokeWidth="1.5" />
          </g>

          <g stroke="#ffb703" strokeWidth="1.3" fill="none" filter="url(#gold-glow)">
            <polygon points="400,126 462,172 432,228 400,274" fill="rgba(255, 183, 3, 0.08)" strokeWidth="2" />
            <polygon points="400,126 430,148 400,172" fill="rgba(255, 208, 0, 0.14)" />
            <polygon points="430,148 462,172 422,185" fill="rgba(255, 123, 0, 0.1)" />
            <polygon points="400,172 430,148 422,185" fill="rgba(255, 183, 3, 0.16)" />
            <polygon points="400,172 422,185 400,212" fill="rgba(255, 183, 3, 0.12)" />
            <polygon points="422,185 462,172 445,210" fill="rgba(255, 123, 0, 0.08)" />
            <polygon points="422,185 445,210 418,222" fill="rgba(255, 183, 3, 0.14)" />
            <polygon points="400,212 422,185 418,222" fill="rgba(255, 208, 0, 0.15)" />
            <polygon points="400,212 418,222 400,248" fill="rgba(255, 183, 3, 0.12)" />
            <polygon points="418,222 445,210 432,228" fill="rgba(255, 123, 0, 0.08)" />
            <polygon points="418,222 432,228 418,252" fill="rgba(255, 183, 3, 0.12)" />
            <polygon points="400,248 418,222 418,252" fill="rgba(255, 208, 0, 0.16)" />
            <polygon points="400,248 418,252 400,274" fill="rgba(255, 183, 3, 0.08)" />
            <line x1="412" y1="138" x2="445" y2="160" strokeWidth="0.9" opacity="0.75" />
            <line x1="400" y1="150" x2="422" y2="185" strokeWidth="0.9" opacity="0.75" />
            <line x1="410" y1="198" x2="435" y2="218" strokeWidth="0.9" opacity="0.75" />
            <line x1="400" y1="230" x2="418" y2="252" strokeWidth="0.9" opacity="0.75" />
          </g>

          {/* Right Gear & Pods */}
          <g stroke="#ffb703" strokeWidth="1.5" fill="none" filter="url(#gold-glow)">
            <rect x="449" y="252" width="6" height="34" rx="2" strokeWidth="1.5" />
            <rect x="441" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(255, 183, 3, 0.15)" />
            <rect x="461" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(255, 183, 3, 0.15)" />
            <line x1="447" y1="289" x2="467" y2="289" strokeWidth="2" />
            <circle cx="447" cy="289" r="2.5" fill="#ffffff" />
            <circle cx="467" cy="289" r="2.5" fill="#ffffff" />
          </g>
          <g filter="url(#at-gold-glow)">
            <ellipse cx="655" cy="216" rx="13" ry="16" fill="rgba(255, 183, 3, 0.15)" stroke="#ffb703" strokeWidth="1.75" />
            <ellipse cx="655" cy="216" rx="7" ry="9" fill="none" stroke="#ffffff" strokeWidth="1" />
            <line x1="642" y1="216" x2="668" y2="216" stroke="#ffb703" strokeWidth="1" />
            <line x1="655" y1="200" x2="655" y2="232" stroke="#ffb703" strokeWidth="1" />
            <circle cx="655" cy="216" r="2" fill="#ffffff" />
            <ellipse cx="712" cy="195" rx="10" ry="13" fill="rgba(255, 183, 3, 0.15)" stroke="#ffb703" strokeWidth="1.5" />
            <ellipse cx="712" cy="195" rx="5" ry="7" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="712" cy="195" r="2" fill="#ffffff" />
          </g>

          {/* Turbine Engine */}
          <g transform="translate(552, 242)" filter="url(#at-gold-soft-glow)">
            <circle cx="0" cy="0" r="27" fill="rgba(255, 183, 3, 0.18)" stroke="#ffb703" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="24" fill="none" stroke="#ff7b00" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#ffd000" strokeWidth="1.25" />
            <circle cx="0" cy="0" r="8" fill="rgba(255, 183, 3, 0.5)" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
            <g stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.95">
              <line x1="0" y1="-8" x2="0" y2="-25" /><line x1="0" y1="8" x2="0" y2="25" />
              <line x1="-8" y1="0" x2="-25" y2="0" /><line x1="8" y1="0" x2="25" y2="0" />
              <line x1="-5.65" y1="-5.65" x2="-17.67" y2="-17.67" /><line x1="5.65" y1="-5.65" x2="17.67" y2="-17.67" />
              <line x1="-5.65" y1="5.65" x2="-17.67" y2="17.67" /><line x1="5.65" y1="5.65" x2="17.67" y2="17.67" />
              <line x1="-7.39" y1="-3.06" x2="-23.09" y2="-9.56" /><line x1="7.39" y1="-3.06" x2="23.09" y2="-9.56" />
              <line x1="-7.39" y1="3.06" x2="-23.09" y2="9.56" /><line x1="7.39" y1="3.06" x2="23.09" y2="9.56" />
              <line x1="-3.06" y1="-7.39" x2="-9.56" y2="-23.09" /><line x1="3.06" y1="-7.39" x2="9.56" y2="-23.09" />
              <line x1="-3.06" y1="7.39" x2="-9.56" y2="23.09" /><line x1="3.06" y1="7.39" x2="9.56" y2="23.09" />
            </g>
          </g>

          {/* Gold Nodes */}
          <g filter="url(#at-gold-node-glow)">
            <circle cx="430" cy="148" r="2.8" fill="#ffffff" stroke="#ffd000" strokeWidth="1" />
            <circle cx="462" cy="172" r="3.5" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" />
            <circle cx="422" cy="185" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="445" cy="210" r="3.2" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" />
            <circle cx="418" cy="222" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="432" cy="228" r="3" fill="#ffffff" stroke="#ffb703" strokeWidth="1" />
            <circle cx="418" cy="252" r="2.8" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="450" cy="172" r="3" fill="#ffffff" stroke="#ffd000" strokeWidth="1" />
            <circle cx="510" cy="171" r="3.2" fill="#ffffff" stroke="#ffb703" strokeWidth="1.2" />
            <circle cx="575" cy="169" r="3.2" fill="#ffffff" stroke="#ffb703" strokeWidth="1.2" />
            <circle cx="640" cy="167" r="3.2" fill="#ffffff" stroke="#ffb703" strokeWidth="1.2" />
            <circle cx="705" cy="165" r="3.2" fill="#ffffff" stroke="#ffb703" strokeWidth="1.2" />
            <circle cx="770" cy="162" r="3.5" fill="#ffffff" stroke="#ffd000" strokeWidth="1.5" />
            <circle cx="450" cy="238" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="500" cy="223" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="565" cy="212" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="630" cy="201" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="695" cy="188" r="3" fill="#ffffff" stroke="#ff7b00" strokeWidth="1" />
            <circle cx="778" cy="175" r="3" fill="#ffffff" stroke="#ffd000" strokeWidth="1" />
            <circle cx="407" cy="105" r="2.5" fill="#ffffff" stroke="#ffd000" strokeWidth="1" />
            <circle cx="414" cy="138" r="3" fill="#ffffff" stroke="#ffb703" strokeWidth="1" />
          </g>

          {/* Seam */}
          <line x1="400" y1="36" x2="400" y2="364" stroke="url(#at-split-gold-grad)" strokeWidth="3.5" strokeLinecap="round" filter="url(#at-gold-glow)" />
          <line x1="400" y1="64" x2="400" y2="330" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="400" cy="38" r="4" fill="#ffffff" stroke="#ffd000" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="126" r="3.5" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="165" r="3" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="212" r="3" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="248" r="3" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="274" r="3.5" fill="#ffffff" stroke="#ffb703" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
          <circle cx="400" cy="362" r="4" fill="#ffffff" stroke="#ff7b00" strokeWidth="1.5" filter="url(#at-gold-node-glow)" />
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════
           LIGHT MODE: SLEEK TITANIUM SLATE GREY ICON
           ══════════════════════════════════════════════════════════════ */}
      {showLight && (
        <g className="at-layer-light">
          <ellipse cx="520" cy="200" rx="220" ry="120" fill="url(#at-grey-radial-bg)" pointerEvents="none" />

          {/* Rhombus Frame */}
          <polyline
            points="400,38 215,200 400,362"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="400,38 585,200 400,362"
            fill="none"
            stroke="url(#at-grey-gradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#at-grey-glow)"
          />
          <polyline
            points="400,38 585,200 400,362"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeOpacity="0.9"
          />

          {/* Circuit Frame Nodes */}
          <g filter="url(#at-grey-node-glow)">
            <circle cx="455" cy="85" r="4.5" fill="#ffffff" stroke="#334155" strokeWidth="2" />
            <circle cx="510" cy="133" r="5" fill="#ffffff" stroke="#475569" strokeWidth="2.5" />
            <circle cx="560" cy="178" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="545" cy="235" r="5" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="495" cy="278" r="4.5" fill="#ffffff" stroke="#475569" strokeWidth="2" />
            <circle cx="445" cy="322" r="4" fill="#ffffff" stroke="#334155" strokeWidth="2" />
          </g>

          {/* Traces */}
          <g stroke="#64748b" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round">
            <polyline points="440,75 440,115 500,115" />
            <polyline points="500,115 520,135 520,165" />
            <polyline points="520,135 570,135 595,160" />
            <polyline points="575,250 600,235 635,235" />
            <polyline points="635,235 660,260 700,260" />
            <polyline points="660,260 645,280 670,295" />
            <polyline points="745,178 755,200 770,200" />
          </g>

          <g filter="url(#at-grey-node-glow)">
            <circle cx="440" cy="115" r="3.5" fill="#475569" />
            <circle cx="500" cy="115" r="4" fill="#ffffff" stroke="#475569" strokeWidth="2" />
            <circle cx="520" cy="165" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="570" cy="135" r="4" fill="#475569" />
            <circle cx="595" cy="160" r="5" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="600" cy="235" r="3.5" fill="#64748b" />
            <circle cx="635" cy="235" r="4" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="700" cy="260" r="5" fill="#ffffff" stroke="#475569" strokeWidth="2" />
            <circle cx="670" cy="295" r="4.5" fill="#ffffff" stroke="#475569" strokeWidth="2" />
            <circle cx="770" cy="200" r="3.5" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
          </g>

          {/* Left Wing (Titanium Slate) */}
          <g fill="url(#at-titanium-slate-grad)">
            <polygon points="400,68 386,138 400,138" />
            <polygon points="400,165 350,172 30,162 22,175 140,195 220,210 310,225 350,238 400,248" />
            <polygon points="350,172 170,188 320,208 350,195" fill="var(--color-bg, #f5f4f0)" />
            <polygon points="348,172 200,186 315,202 348,192" />
            <polygon points="400,126 338,172 368,228 400,274" />
            <polygon points="396,140 354,172 376,210 396,210" fill="var(--color-bg, #f5f4f0)" />
            <polygon points="362,175 325,225 355,232 388,185" />
            <rect x="345" y="252" width="6" height="34" rx="2" />
            <rect x="333" y="278" width="12" height="22" rx="4" />
            <rect x="353" y="278" width="12" height="22" rx="4" />
            <rect x="339" y="284" width="20" height="6" rx="2" />
            <circle cx="248" cy="242" r="27" />
            <ellipse cx="145" cy="216" rx="13" ry="16" />
            <ellipse cx="88" cy="195" rx="10" ry="13" />
          </g>

          {/* Right Digital Twin Wireframe */}
          <g stroke="#475569" strokeWidth="1.5" fill="none">
            <polygon points="400,68 414,138 400,138" fill="rgba(71, 85, 105, 0.08)" />
            <line x1="400" y1="92" x2="408" y2="138" />
            <line x1="400" y1="115" x2="414" y2="138" />
            <line x1="400" y1="68" x2="407" y2="105" />
          </g>
          <g stroke="#475569" strokeWidth="1.75" fill="none">
            <polygon points="400,165 450,172 770,162 778,175 660,195 580,210 490,225 450,238 400,248" fill="rgba(100, 116, 139, 0.08)" />
            <line x1="450" y1="172" x2="450" y2="238" strokeWidth="1.5" />
            <line x1="510" y1="171" x2="500" y2="223" strokeWidth="1.5" />
            <line x1="575" y1="169" x2="565" y2="212" strokeWidth="1.5" />
            <line x1="640" y1="167" x2="630" y2="201" strokeWidth="1.5" />
            <line x1="705" y1="165" x2="695" y2="188" strokeWidth="1.5" />
            <line x1="400" y1="202" x2="774" y2="169" strokeWidth="1.25" strokeDasharray="6 3" stroke="#64748b" />
            <line x1="450" y1="172" x2="500" y2="223" strokeWidth="1.2" stroke="#64748b" opacity="0.85" />
            <line x1="510" y1="171" x2="450" y2="238" strokeWidth="1.2" stroke="#64748b" opacity="0.85" />
            <line x1="510" y1="171" x2="565" y2="212" strokeWidth="1.2" stroke="#64748b" opacity="0.85" />
            <line x1="575" y1="169" x2="500" y2="223" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="575" y1="169" x2="630" y2="201" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="640" y1="167" x2="565" y2="212" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="640" y1="167" x2="695" y2="188" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="705" y1="165" x2="630" y2="201" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="705" y1="165" x2="778" y2="175" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <line x1="770" y1="162" x2="695" y2="188" strokeWidth="1.2" opacity="0.85" stroke="#64748b" />
            <polygon points="452,172 600,186 485,202 452,192" fill="rgba(71, 85, 105, 0.15)" stroke="#64748b" strokeWidth="1.5" />
          </g>

          <g stroke="#475569" strokeWidth="1.3" fill="none">
            <polygon points="400,126 462,172 432,228 400,274" fill="rgba(71, 85, 105, 0.08)" strokeWidth="2" />
            <polygon points="400,126 430,148 400,172" fill="rgba(100, 116, 139, 0.12)" />
            <polygon points="430,148 462,172 422,185" fill="rgba(71, 85, 105, 0.1)" />
            <polygon points="400,172 430,148 422,185" fill="rgba(100, 116, 139, 0.14)" />
            <polygon points="400,172 422,185 400,212" fill="rgba(71, 85, 105, 0.1)" />
            <polygon points="422,185 462,172 445,210" fill="rgba(100, 116, 139, 0.08)" />
            <polygon points="422,185 445,210 418,222" fill="rgba(71, 85, 105, 0.12)" />
            <polygon points="400,212 422,185 418,222" fill="rgba(100, 116, 139, 0.15)" />
            <polygon points="400,212 418,222 400,248" fill="rgba(71, 85, 105, 0.12)" />
            <polygon points="418,222 445,210 432,228" fill="rgba(100, 116, 139, 0.08)" />
            <polygon points="418,222 432,228 418,252" fill="rgba(71, 85, 105, 0.1)" />
            <polygon points="400,248 418,222 418,252" fill="rgba(100, 116, 139, 0.14)" />
            <polygon points="400,248 418,252 400,274" fill="rgba(71, 85, 105, 0.08)" />
            <line x1="412" y1="138" x2="445" y2="160" strokeWidth="0.9" stroke="#64748b" opacity="0.75" />
            <line x1="400" y1="150" x2="422" y2="185" strokeWidth="0.9" stroke="#64748b" opacity="0.75" />
            <line x1="410" y1="198" x2="435" y2="218" strokeWidth="0.9" stroke="#64748b" opacity="0.75" />
            <line x1="400" y1="230" x2="418" y2="252" strokeWidth="0.9" stroke="#64748b" opacity="0.75" />
          </g>

          {/* Right Gear & Pods */}
          <g stroke="#475569" strokeWidth="1.5" fill="none">
            <rect x="449" y="252" width="6" height="34" rx="2" strokeWidth="1.5" />
            <rect x="441" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(71, 85, 105, 0.12)" />
            <rect x="461" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(71, 85, 105, 0.12)" />
            <line x1="447" y1="289" x2="467" y2="289" strokeWidth="2" stroke="#64748b" />
            <circle cx="447" cy="289" r="2.5" fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx="467" cy="289" r="2.5" fill="#ffffff" stroke="#475569" strokeWidth="1" />
          </g>
          <g>
            <ellipse cx="655" cy="216" rx="13" ry="16" fill="rgba(100, 116, 139, 0.12)" stroke="#475569" strokeWidth="1.75" />
            <ellipse cx="655" cy="216" rx="7" ry="9" fill="none" stroke="#64748b" strokeWidth="1" />
            <line x1="642" y1="216" x2="668" y2="216" stroke="#64748b" strokeWidth="1" />
            <line x1="655" y1="200" x2="655" y2="232" stroke="#64748b" strokeWidth="1" />
            <circle cx="655" cy="216" r="2" fill="#334155" />
            <ellipse cx="712" cy="195" rx="10" ry="13" fill="rgba(100, 116, 139, 0.12)" stroke="#475569" strokeWidth="1.5" />
            <ellipse cx="712" cy="195" rx="5" ry="7" fill="none" stroke="#64748b" strokeWidth="0.8" />
            <circle cx="712" cy="195" r="2" fill="#334155" />
          </g>

          {/* Turbine Engine */}
          <g transform="translate(552, 242)">
            <circle cx="0" cy="0" r="27" fill="rgba(100, 116, 139, 0.15)" stroke="#334155" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="24" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#94a3b8" strokeWidth="1.25" />
            <circle cx="0" cy="0" r="8" fill="rgba(100, 116, 139, 0.3)" stroke="#334155" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#1e293b" />
            <g stroke="#334155" strokeWidth="1.2" strokeLinecap="round" opacity="0.95">
              <line x1="0" y1="-8" x2="0" y2="-25" /><line x1="0" y1="8" x2="0" y2="25" />
              <line x1="-8" y1="0" x2="-25" y2="0" /><line x1="8" y1="0" x2="25" y2="0" />
              <line x1="-5.65" y1="-5.65" x2="-17.67" y2="-17.67" /><line x1="5.65" y1="-5.65" x2="17.67" y2="-17.67" />
              <line x1="-5.65" y1="5.65" x2="-17.67" y2="17.67" /><line x1="5.65" y1="5.65" x2="17.67" y2="17.67" />
              <line x1="-7.39" y1="-3.06" x2="-23.09" y2="-9.56" /><line x1="7.39" y1="-3.06" x2="23.09" y2="-9.56" />
              <line x1="-7.39" y1="3.06" x2="-23.09" y2="9.56" /><line x1="7.39" y1="3.06" x2="23.09" y2="9.56" />
              <line x1="-3.06" y1="-7.39" x2="-9.56" y2="-23.09" /><line x1="3.06" y1="-7.39" x2="9.56" y2="-23.09" />
              <line x1="-3.06" y1="7.39" x2="-9.56" y2="23.09" /><line x1="3.06" y1="7.39" x2="9.56" y2="23.09" />
            </g>
          </g>

          {/* Grey Nodes */}
          <g filter="url(#at-grey-node-glow)">
            <circle cx="430" cy="148" r="2.8" fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx="462" cy="172" r="3.5" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
            <circle cx="422" cy="185" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="445" cy="210" r="3.2" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
            <circle cx="418" cy="222" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="432" cy="228" r="3" fill="#ffffff" stroke="#334155" strokeWidth="1" />
            <circle cx="418" cy="252" r="2.8" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="450" cy="172" r="3" fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx="510" cy="171" r="3.2" fill="#ffffff" stroke="#475569" strokeWidth="1.2" />
            <circle cx="575" cy="169" r="3.2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
            <circle cx="640" cy="167" r="3.2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
            <circle cx="705" cy="165" r="3.2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
            <circle cx="770" cy="162" r="3.5" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
            <circle cx="450" cy="238" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="500" cy="223" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="565" cy="212" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="630" cy="201" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="695" cy="188" r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <circle cx="778" cy="175" r="3" fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx="407" cy="105" r="2.5" fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx="414" cy="138" r="3" fill="#ffffff" stroke="#334155" strokeWidth="1" />
          </g>

          {/* Seam */}
          <line x1="400" y1="36" x2="400" y2="364" stroke="url(#at-split-grey-grad)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="400" y1="64" x2="400" y2="330" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="400" cy="38" r="4" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="126" r="3.5" fill="#ffffff" stroke="#334155" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="165" r="3" fill="#ffffff" stroke="#334155" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="212" r="3" fill="#ffffff" stroke="#475569" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="248" r="3" fill="#ffffff" stroke="#475569" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="274" r="3.5" fill="#ffffff" stroke="#334155" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
          <circle cx="400" cy="362" r="4" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" filter="url(#at-grey-node-glow)" />
        </g>
      )}
    </svg>
  );
};

export default AeroTwinIcon;
