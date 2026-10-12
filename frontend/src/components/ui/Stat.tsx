import React from 'react';

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

/** Label / value / hint. Used inside stat strips rather than as standalone cards. */
export const Stat: React.FC<StatProps> = ({ label, value, unit, hint, size = 'md', className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="label">{label}</dt>
    <dd className="mt-1.5 flex items-baseline gap-1.5 m-0">
      <span className={`${size === 'lg' ? 'text-metric' : 'text-xl'} font-medium tracking-tight text-fg tabular`}>{value}</span>
      {unit && <span className="text-sm text-fg-muted">{unit}</span>}
    </dd>
    {hint && <dd className="mt-1 text-xs text-fg-muted m-0">{hint}</dd>}
  </div>
);

/** A row of stats separated by hairlines; wraps to a 2-column grid on small screens. */
export const StatStrip: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <dl className={`grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr gap-px [&>div:last-child:nth-child(odd)]:col-span-2 lg:[&>div:last-child:nth-child(odd)]:col-span-1 bg-line border border-line rounded-lg overflow-hidden m-0 ${className}`}>
    {React.Children.map(children, (child) =>
      child ? <div className="bg-surface p-4 md:p-5">{child}</div> : null,
    )}
  </dl>
);
