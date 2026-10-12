import React from 'react';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'section' | 'div' | 'article';
  padded?: boolean;
  headingLevel?: 2 | 3;
}

/** The single surface container used across the app: surface color, hairline border, small radius. */
export const Panel: React.FC<PanelProps> = ({
  title, description, actions, as = 'section', padded = true, headingLevel = 2, className = '', children, ...rest
}) => {
  const Tag = as as React.ElementType;
  const H = (`h${headingLevel}`) as React.ElementType;
  const headingId = React.useId();
  return (
    <Tag
      className={`bg-surface border border-line rounded-lg min-w-0 ${className}`}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 md:px-5 md:pt-5">
          <div className="min-w-0">
            {title && <H id={headingId} className="text-base font-semibold tracking-normal">{title}</H>}
            {description && <p className="text-sm text-fg-muted mt-1 max-w-measure">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-4 md:p-5' : ''}>{children}</div>
    </Tag>
  );
};
