import React from 'react';

interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}

/** Radio-group semantics with arrow-key navigation, styled as a segmented control. */
export function Segmented<T extends string>({ label, options, value, onChange, size = 'sm' }: SegmentedProps<T>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-md bg-surface-interactive border border-line-subtle max-w-full overflow-x-auto">
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`${size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm'} rounded-[3px] font-medium whitespace-nowrap transition-colors duration-fast ${
              active ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
