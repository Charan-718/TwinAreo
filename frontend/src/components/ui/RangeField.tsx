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
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
        <output htmlFor={id} className="text-sm font-mono text-fg tabular">{format(value)}</output>
      </div>
      {description && <p className="text-xs text-fg-muted">{description}</p>}
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
            className="absolute -bottom-1 w-px h-2 bg-fg-muted pointer-events-none"
            style={{ left: `calc(${markerPct}% )` }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-fg-muted tabular">
        <span>{format(min)}</span>
        {marker && <span>{marker.label}: {format(marker.value)}</span>}
        <span>{format(max)}</span>
      </div>
    </div>
  );
};
