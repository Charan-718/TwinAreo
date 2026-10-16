import React from 'react';

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Hollywood Hacker Metric readout with phosphor value, monospace label, and bracketed hints.
 */
export const Stat: React.FC<StatProps> = ({
  label,
  value,
  unit,
  hint,
  size = 'md',
  className = '',
}) => (
  <div className={`min-w-0 flex flex-col justify-between h-full ${className}`}>
    <div>
      <dt className="label flex items-center gap-1.5 text-primary/80">
        <span className="inline-block w-1 h-1 bg-primary" aria-hidden="true" />
        <span>{label}</span>
      </dt>
      <dd className="mt-2 flex items-baseline gap-1.5 m-0">
        <span
          className={`${
            size === 'lg' ? 'text-metric' : 'text-xl'
          } font-bold tracking-tight text-fg font-mono tabular`}
          style={{ textShadow: '0 0 10px rgba(0, 255, 157, 0.3)' }}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-mono font-medium text-primary/70">{unit}</span>}
      </dd>
    </div>
    {hint && (
      <dd className="mt-2 text-xs text-fg-muted m-0 font-mono leading-normal flex items-start gap-1">
        <span className="text-primary/50 shrink-0">&gt;</span>
        <span>{hint}</span>
      </dd>
    )}
  </div>
);

/**
 * Cut-corner metric strip container with clean grid separation.
 */
export const StatStrip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`cyber-cut-frame mb-6 ${className}`}>
    <dl
      className="cyber-cut-inner grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr gap-px bg-line m-0"
    >
      {React.Children.map(children, (child) =>
        child ? <div className="p-4 md:p-5 bg-surface relative">{child}</div> : null,
      )}
    </dl>
  </div>
);
