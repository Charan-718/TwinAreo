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

/**
 * Cyber segmented control with chamfered active segments and arrow navigation.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'sm',
}: SegmentedProps<T>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        ? -1
        : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center p-0.5 border border-line bg-surface-sunken max-w-full overflow-x-auto gap-1 clip-cut-btn"
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`${
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-4 text-xs md:text-sm'
            } font-display uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-fast clip-cut-btn focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              active
                ? 'bg-primary text-primary-on shadow-[0_0_8px_rgba(0,255,157,0.4)]'
                : 'text-fg-secondary hover:text-primary hover:bg-surface-interactive/60'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
