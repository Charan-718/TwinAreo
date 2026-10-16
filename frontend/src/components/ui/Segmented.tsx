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
  equalWidth?: boolean;
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
  equalWidth = false,
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
      className={`inline-flex items-center p-0.5 border border-line bg-surface-sunken gap-1 clip-cut-btn shrink-0 ${
        equalWidth ? 'w-[122px] justify-between' : 'max-w-full overflow-x-auto'
      }`}
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
              size === 'sm'
                ? equalWidth
                  ? 'h-7 w-9 px-0 text-xs flex items-center justify-center shrink-0'
                  : 'h-7 px-3 text-xs'
                : equalWidth
                ? 'h-8 w-11 px-0 text-xs md:text-sm flex items-center justify-center shrink-0'
                : 'h-8 px-4 text-xs md:text-sm'
            } font-display uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-fast clip-cut-btn focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              active
                ? 'bg-primary text-primary-on shadow-[0_0_8px_rgba(255,255,13,0.4)]'
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
