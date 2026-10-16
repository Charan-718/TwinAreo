import React from 'react';

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  description?: string;
  marker?: { value: number; label: string };
}

/** Labeled slider with visible value, min/max captions and an optional reference marker. */
export const RangeField: React.FC<RangeFieldProps> = ({ label, value, min, max, step, format, onChange, description, marker }) => {
  const id = React.useId();
  const markerPct = marker ? ((marker.value - min) / (max - min)) * 100 : null;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 font-mono">
        <label htmlFor={id} className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">
          <span className="text-primary/70 mr-1">{"//"}</span>{label}
        </label>
        <output
          htmlFor={id}
          className="text-xs font-mono text-primary font-bold tabular px-2 py-0.5 bg-surface-sunken border border-primary/30 shadow-[0_0_8px_rgba(255,255,13,0.3)]"
          style={{ clipPath: 'var(--clip-badge)' }}
        >
          {format(value)}
        </output>
      </div>
      {description && <p className="text-xs text-fg-muted font-mono">{description}</p>}
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range w-full"
          aria-valuetext={format(value)}
        />
        {markerPct !== null && (
          <span
            className="absolute -bottom-1 w-0.5 h-3 bg-accent pointer-events-none shadow-[0_0_6px_var(--color-accent)]"
            style={{ left: `calc(${markerPct}% )` }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex justify-between text-[11px] text-fg-muted tabular font-mono">
        <span>{format(min)}</span>
        {marker && <span className="text-accent font-medium">[{marker.label}: {format(marker.value)}]</span>}
        <span>{format(max)}</span>
      </div>
    </div>
  );
};
