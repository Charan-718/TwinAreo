import React from 'react';

interface AeroTwinIconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
  physicalColor?: string;
  cyanColor?: string;
  emeraldColor?: string;
}

/**
 * AeroTwin / TwinAero Hybrid Icon:
 * - Left half: Physical aircraft in sleek aerospace dark navy blue (#0c203b).
 * - Right half: Digital Twin in electric cyan (#00f0ff) and phosphor teal (#00ff9d)
 *   featuring a low-poly wireframe mesh, glowing turbine fan blades, circuit traces,
 *   and telemetry data bus nodes.
 */
export const AeroTwinIcon: React.FC<AeroTwinIconProps> = ({
  width = '100%',
  height = '100%',
  className = '',
  physicalColor = '#0c203b',
  cyanColor = 'var(--color-primary, #ffb703)',
  emeraldColor = 'var(--color-accent, #ff7b00)',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      width={width}
      height={height}
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        {/* Intense neon cyan glow filter */}
        <filter id="dt-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Node pulse glow filter */}
        <filter id="dt-node-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft atmospheric bloom */}
        <filter id="dt-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Cyan to emerald telemetry gradient */}
        <linearGradient id="dt-cyan-gradient" x1="400" y1="50" x2="780" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={cyanColor} />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor={emeraldColor} />
        </linearGradient>

        {/* Physical aerospace dark blue gradient */}
        <linearGradient id="physical-grad" x1="50" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#081628" />
          <stop offset="60%" stopColor={physicalColor} />
          <stop offset="100%" stopColor="#132c4f" />
        </linearGradient>

        {/* Center split seam glow gradient */}
        <linearGradient id="split-seam-grad" x1="400" y1="40" x2="400" y2="365" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={cyanColor} stopOpacity="0.3" />
          <stop offset="30%" stopColor={cyanColor} stopOpacity="0.9" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor={emeraldColor} stopOpacity="0.4" />
        </linearGradient>

        {/* Digital Twin translucent facet background */}
        <radialGradient id="mesh-bg-radial" cx="500" cy="180" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={cyanColor} stopOpacity="0.12" />
          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ══════════════════════════════════════════════════════════════
          BACKGROUND RADIAL AMBIENCE (Digital Twin Half)
          ══════════════════════════════════════════════════════════════ */}
      <ellipse cx="520" cy="200" rx="220" ry="120" fill="url(#mesh-bg-radial)" pointerEvents="none" />

      {/* ══════════════════════════════════════════════════════════════
          1. OUTER DIAMOND RHOMBUS FRAME
          ══════════════════════════════════════════════════════════════ */}
      {/* Left Diamond (Physical): Solid Dark Blue */}
      <polyline
        points="400,38 215,200 400,362"
        fill="none"
        stroke={physicalColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Diamond (Digital Twin): Glowing Data Conduit */}
      <polyline
        points="400,38 585,200 400,362"
        fill="none"
        stroke="url(#dt-cyan-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#dt-cyan-glow)"
      />
      {/* Inner thin conduit core */}
      <polyline
        points="400,38 585,200 400,362"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />

      {/* Circuit Nodes on Right Diamond Frame */}
      <g filter="url(#dt-node-glow)">
        <circle cx="455" cy="85" r="4.5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="510" cy="133" r="5" fill="#ffffff" stroke={cyanColor} strokeWidth="2.5" />
        <circle cx="560" cy="178" r="4.5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="545" cy="235" r="5" fill="#ffffff" stroke={emeraldColor} strokeWidth="2" />
        <circle cx="495" cy="278" r="4.5" fill="#ffffff" stroke={emeraldColor} strokeWidth="2" />
        <circle cx="445" cy="322" r="4" fill="#ffffff" stroke={emeraldColor} strokeWidth="2" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          2. DATA CIRCUIT TRACES & EXTENSION NODES (Digital Twin)
          ══════════════════════════════════════════════════════════════ */}
      <g stroke={cyanColor} strokeWidth="2" fill="none" filter="url(#dt-cyan-glow)" strokeLinejoin="round" strokeLinecap="round">
        {/* Top-Right Trace Extension */}
        <polyline points="440,75 440,115 500,115" />
        <polyline points="500,115 520,135 520,165" />
        <polyline points="520,135 570,135 595,160" />

        {/* Lower-Right Trace Extension (under the wing) */}
        <polyline points="575,250 600,235 635,235" />
        <polyline points="635,235 660,260 700,260" />
        <polyline points="660,260 645,280 670,295" />

        {/* Wingtip Bus Coupler */}
        <polyline points="745,178 755,200 770,200" />
      </g>

      {/* Nodes on Circuit Extensions */}
      <g filter="url(#dt-node-glow)">
        <circle cx="440" cy="115" r="3.5" fill={cyanColor} />
        <circle cx="500" cy="115" r="4" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="520" cy="165" r="4.5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="570" cy="135" r="4" fill={cyanColor} />
        <circle cx="595" cy="160" r="5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />

        <circle cx="600" cy="235" r="3.5" fill={cyanColor} />
        <circle cx="635" cy="235" r="4" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="700" cy="260" r="5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
        <circle cx="670" cy="295" r="4.5" fill="#ffffff" stroke={emeraldColor} strokeWidth="2" />
        <circle cx="770" cy="200" r="3.5" fill="#ffffff" stroke={cyanColor} strokeWidth="2" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          3. LEFT HALF: PHYSICAL AIRCRAFT (Solid Dark Navy Blue)
          ══════════════════════════════════════════════════════════════ */}
      <g fill="url(#physical-grad)">
        {/* Tail / Vertical Fin (Left side) */}
        <polygon points="400,68 386,138 400,138" />

        {/* Main Left Wing */}
        {/* Outer aerodynamic swept wing geometry */}
        <polygon points="
          400,165
          350,172
          30,162
          22,175
          140,195
          220,210
          310,225
          350,238
          400,248
        " />

        {/* Negative Space Chevron Slash (Upper Wing Separation Line) */}
        <polygon
          points="350,172 170,188 320,208 350,195"
          fill="#eafaf1" /* Canvas backdrop cutout tone */
          className="fill-bg"
        />

        {/* Re-fill Inner Wing Slat (aerodynamic wing root) */}
        <polygon points="
          348,172
          200,186
          315,202
          348,192
        " />

        {/* Left Cockpit Canopy & Fuselage Structure */}
        <polygon points="
          400,126
          338,172
          368,228
          400,274
        " />

        {/* Left Windshield Pane (Negative Space Glass Cutout) */}
        <polygon
          points="396,140 354,172 376,210 396,210"
          fill="#eafaf1"
          className="fill-bg"
        />

        {/* Left Wing Intake / Inner Flank Accent */}
        <polygon points="362,175 325,225 355,232 388,185" />

        {/* Left Landing Gear: Strut and Dual Wheels */}
        <rect x="345" y="252" width="6" height="34" rx="2" />
        <rect x="333" y="278" width="12" height="22" rx="4" />
        <rect x="353" y="278" width="12" height="22" rx="4" />
        <rect x="339" y="284" width="20" height="6" rx="2" />

        {/* Left Engines: Solid Turbofan & Outer Pods */}
        {/* Large Main Turbofan Nacelle */}
        <circle cx="248" cy="242" r="27" />
        {/* Outer Nacelle Pod 1 */}
        <ellipse cx="145" cy="216" rx="13" ry="16" />
        {/* Outer Nacelle Pod 2 */}
        <ellipse cx="88" cy="195" rx="10" ry="13" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          4. RIGHT HALF: DIGITAL TWIN (Luminous Wireframe Mesh & Turbine)
          ══════════════════════════════════════════════════════════════ */}
      {/* Tail / Vertical Fin (Digital Twin Wireframe) */}
      <g stroke={cyanColor} strokeWidth="1.5" fill="none" filter="url(#dt-cyan-glow)">
        <polygon points="400,68 414,138 400,138" fill="rgba(0, 240, 255, 0.08)" />
        <line x1="400" y1="92" x2="408" y2="138" />
        <line x1="400" y1="115" x2="414" y2="138" />
        <line x1="400" y1="68" x2="407" y2="105" />
      </g>

      {/* Right Wing Outline & Digital Truss Lattice */}
      <g stroke={cyanColor} strokeWidth="1.75" fill="none" filter="url(#dt-cyan-glow)">
        {/* Outer Boundary of Right Wing */}
        <polygon
          points="
            400,165
            450,172
            770,162
            778,175
            660,195
            580,210
            490,225
            450,238
            400,248
          "
          fill="rgba(0, 240, 255, 0.06)"
        />

        {/* Primary Structural Rib Stations */}
        <line x1="450" y1="172" x2="450" y2="238" strokeWidth="1.5" />
        <line x1="510" y1="171" x2="500" y2="223" strokeWidth="1.5" />
        <line x1="575" y1="169" x2="565" y2="212" strokeWidth="1.5" />
        <line x1="640" y1="167" x2="630" y2="201" strokeWidth="1.5" />
        <line x1="705" y1="165" x2="695" y2="188" strokeWidth="1.5" />

        {/* Longitudinal Spar Line */}
        <line x1="400" y1="202" x2="774" y2="169" strokeWidth="1.25" strokeDasharray="6 3" />

        {/* Diagonal Truss Cross-Bracing Mesh */}
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

        {/* Inner Wing Aerodynamic Slat Accent */}
        <polygon points="452,172 600,186 485,202 452,192" fill="rgba(0, 255, 157, 0.15)" stroke={emeraldColor} strokeWidth="1.5" />
      </g>

      {/* Right Cockpit Canopy: Detailed Delaunay Polygonal Wireframe Mesh */}
      <g stroke={cyanColor} strokeWidth="1.3" fill="none" filter="url(#dt-cyan-glow)">
        {/* Outer Canopy Perimeter */}
        <polygon
          points="400,126 462,172 432,228 400,274"
          fill="rgba(0, 240, 255, 0.08)"
          strokeWidth="2"
        />

        {/* Primary Facet Triangles inside Canopy */}
        <polygon points="400,126 430,148 400,172" fill="rgba(0, 240, 255, 0.12)" />
        <polygon points="430,148 462,172 422,185" fill="rgba(0, 255, 157, 0.08)" />
        <polygon points="400,172 430,148 422,185" fill="rgba(0, 240, 255, 0.15)" />
        <polygon points="400,172 422,185 400,212" fill="rgba(56, 189, 248, 0.1)" />
        <polygon points="422,185 462,172 445,210" fill="rgba(0, 240, 255, 0.08)" />
        <polygon points="422,185 445,210 418,222" fill="rgba(0, 255, 157, 0.12)" />
        <polygon points="400,212 422,185 418,222" fill="rgba(0, 240, 255, 0.14)" />
        <polygon points="400,212 418,222 400,248" fill="rgba(56, 189, 248, 0.12)" />
        <polygon points="418,222 445,210 432,228" fill="rgba(0, 240, 255, 0.06)" />
        <polygon points="418,222 432,228 418,252" fill="rgba(0, 255, 157, 0.1)" />
        <polygon points="400,248 418,222 418,252" fill="rgba(0, 240, 255, 0.15)" />
        <polygon points="400,248 418,252 400,274" fill="rgba(0, 240, 255, 0.08)" />

        {/* Micro-mesh cross struts */}
        <line x1="412" y1="138" x2="445" y2="160" strokeWidth="0.9" opacity="0.7" />
        <line x1="400" y1="150" x2="422" y2="185" strokeWidth="0.9" opacity="0.7" />
        <line x1="410" y1="198" x2="435" y2="218" strokeWidth="0.9" opacity="0.7" />
        <line x1="400" y1="230" x2="418" y2="252" strokeWidth="0.9" opacity="0.7" />
      </g>

      {/* Right Landing Gear (Digital Twin Wireframe) */}
      <g stroke={cyanColor} strokeWidth="1.5" fill="none" filter="url(#dt-cyan-glow)">
        <rect x="449" y="252" width="6" height="34" rx="2" strokeWidth="1.5" />
        <rect x="441" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(0, 240, 255, 0.12)" />
        <rect x="461" y="278" width="12" height="22" rx="4" strokeWidth="1.5" fill="rgba(0, 240, 255, 0.12)" />
        <line x1="447" y1="289" x2="467" y2="289" strokeWidth="2" />
        <circle cx="447" cy="289" r="2.5" fill="#ffffff" />
        <circle cx="467" cy="289" r="2.5" fill="#ffffff" />
      </g>

      {/* Right Secondary Pods (Wireframe) */}
      <g filter="url(#dt-cyan-glow)">
        {/* Pod 1 */}
        <ellipse cx="655" cy="216" rx="13" ry="16" fill="rgba(0, 240, 255, 0.12)" stroke={cyanColor} strokeWidth="1.75" />
        <ellipse cx="655" cy="216" rx="7" ry="9" fill="none" stroke="#ffffff" strokeWidth="1" />
        <line x1="642" y1="216" x2="668" y2="216" stroke={cyanColor} strokeWidth="1" />
        <line x1="655" y1="200" x2="655" y2="232" stroke={cyanColor} strokeWidth="1" />
        <circle cx="655" cy="216" r="2" fill="#ffffff" />

        {/* Pod 2 */}
        <ellipse cx="712" cy="195" rx="10" ry="13" fill="rgba(0, 240, 255, 0.12)" stroke={cyanColor} strokeWidth="1.5" />
        <ellipse cx="712" cy="195" rx="5" ry="7" fill="none" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="712" cy="195" r="2" fill="#ffffff" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          5. THE DIGITAL TWIN TURBOFAN ENGINE (High-Tech Turbine Disk)
          ══════════════════════════════════════════════════════════════ */}
      <g transform="translate(552, 242)" filter="url(#dt-soft-glow)">
        {/* Outer Glowing Turbine Cowling Rings */}
        <circle cx="0" cy="0" r="27" fill="rgba(0, 240, 255, 0.15)" stroke={cyanColor} strokeWidth="2.5" />
        <circle cx="0" cy="0" r="24" fill="none" stroke={emeraldColor} strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="0" cy="0" r="16" fill="none" stroke={cyanColor} strokeWidth="1.25" />
        <circle cx="0" cy="0" r="8" fill="rgba(0, 240, 255, 0.4)" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="3" fill="#ffffff" />

        {/* 16 Radial Turbine Fan Blades */}
        <g stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
          <line x1="0" y1="-8" x2="0" y2="-25" />
          <line x1="0" y1="8" x2="0" y2="25" />
          <line x1="-8" y1="0" x2="-25" y2="0" />
          <line x1="8" y1="0" x2="25" y2="0" />
          <line x1="-5.65" y1="-5.65" x2="-17.67" y2="-17.67" />
          <line x1="5.65" y1="-5.65" x2="17.67" y2="-17.67" />
          <line x1="-5.65" y1="5.65" x2="-17.67" y2="17.67" />
          <line x1="5.65" y1="5.65" x2="17.67" y2="17.67" />
          <line x1="-7.39" y1="-3.06" x2="-23.09" y2="-9.56" />
          <line x1="7.39" y1="-3.06" x2="23.09" y2="-9.56" />
          <line x1="-7.39" y1="3.06" x2="-23.09" y2="9.56" />
          <line x1="7.39" y1="3.06" x2="23.09" y2="9.56" />
          <line x1="-3.06" y1="-7.39" x2="-9.56" y2="-23.09" />
          <line x1="3.06" y1="-7.39" x2="9.56" y2="-23.09" />
          <line x1="-3.06" y1="7.39" x2="-9.56" y2="23.09" />
          <line x1="3.06" y1="7.39" x2="9.56" y2="23.09" />
        </g>
      </g>

      {/* ══════════════════════════════════════════════════════════════
          6. DIGITAL TWIN WIREFRAME VERTEX NODES
          ══════════════════════════════════════════════════════════════ */}
      <g filter="url(#dt-node-glow)">
        {/* Canopy Mesh Vertex Nodes */}
        <circle cx="430" cy="148" r="2.8" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />
        <circle cx="462" cy="172" r="3.5" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" />
        <circle cx="422" cy="185" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="445" cy="210" r="3.2" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" />
        <circle cx="418" cy="222" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="432" cy="228" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />
        <circle cx="418" cy="252" r="2.8" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />

        {/* Wing Mesh Vertex Nodes */}
        <circle cx="450" cy="172" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />
        <circle cx="510" cy="171" r="3.2" fill="#ffffff" stroke={cyanColor} strokeWidth="1.2" />
        <circle cx="575" cy="169" r="3.2" fill="#ffffff" stroke={cyanColor} strokeWidth="1.2" />
        <circle cx="640" cy="167" r="3.2" fill="#ffffff" stroke={cyanColor} strokeWidth="1.2" />
        <circle cx="705" cy="165" r="3.2" fill="#ffffff" stroke={cyanColor} strokeWidth="1.2" />
        <circle cx="770" cy="162" r="3.5" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" />

        <circle cx="450" cy="238" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="500" cy="223" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="565" cy="212" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="630" cy="201" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="695" cy="188" r="3" fill="#ffffff" stroke={emeraldColor} strokeWidth="1" />
        <circle cx="778" cy="175" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />

        {/* Tail Nodes */}
        <circle cx="407" cy="105" r="2.5" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />
        <circle cx="414" cy="138" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          7. CENTER SPLIT SEAM (Physical vs. Digital Twin Boundary)
          ══════════════════════════════════════════════════════════════ */}
      {/* Primary Glowing Seam Line */}
      <line
        x1="400"
        y1="36"
        x2="400"
        y2="364"
        stroke="url(#split-seam-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        filter="url(#dt-cyan-glow)"
      />
      {/* Intense White Core Line */}
      <line
        x1="400"
        y1="64"
        x2="400"
        y2="330"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Center Seam Alignment Pips */}
      <circle cx="400" cy="38" r="4" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="126" r="3.5" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="165" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="212" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="248" r="3" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="274" r="3.5" fill="#ffffff" stroke={cyanColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
      <circle cx="400" cy="362" r="4" fill="#ffffff" stroke={emeraldColor} strokeWidth="1.5" filter="url(#dt-node-glow)" />
    </svg>
  );
};

export default AeroTwinIcon;
