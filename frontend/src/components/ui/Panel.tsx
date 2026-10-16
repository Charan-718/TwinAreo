import React from 'react';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'section' | 'div' | 'article';
  padded?: boolean;
  headingLevel?: 2 | 3;
}

/**
 * Hollywood Hacker Cyber Deck Panel
 * Features cut-edge geometry using CSS clip-path variables,
 * phosphor perimeter borders, and cybernetic header accents.
 */
export const Panel: React.FC<PanelProps> = ({
  title,
  description,
  actions,
  as = 'section',
  padded = true,
  headingLevel = 2,
  className = '',
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  const H = (`h${headingLevel}`) as React.ElementType;
  const headingId = React.useId();

  return (
    <Tag
      className={`cyber-cut-frame min-w-0 block ${className}`}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      <div className="cyber-cut-inner relative flex flex-col">
        {/* Subtle Tech Corner Node Dots */}
        <div
          className="absolute top-2 right-3 flex items-center gap-1 opacity-50 pointer-events-none select-none text-[9px] font-mono text-primary"
          aria-hidden="true"
        >
          <span>SYS//REC</span>
          <span className="w-1 h-1 bg-primary inline-block" />
          <span className="w-1 h-1 bg-primary/40 inline-block" />
        </div>

        {(title || actions) && (
          <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-3.5 md:px-5 md:pt-4 border-b border-line-subtle pb-3">
            <div className="min-w-0">
              {title && (
                <H
                  id={headingId}
                  className="text-sm md:text-base font-bold text-fg tracking-wide font-display flex items-center gap-2"
                >
                  <span className="text-primary text-xs opacity-75 font-mono">{"//"}</span>
                  <span>{title}</span>
                </H>
              )}
              {description && (
                <p className="text-xs md:text-sm text-fg-secondary mt-1 max-w-measure leading-normal font-mono">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </header>
        )}
        <div className={`flex-1 ${padded ? 'p-4 md:p-5' : ''}`}>{children}</div>
      </div>
    </Tag>
  );
};
