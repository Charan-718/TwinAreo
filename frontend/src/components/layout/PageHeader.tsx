import React from 'react';

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions, meta }) => (
  <header className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0 space-y-2">
      {eyebrow && <p className="label">{eyebrow}</p>}
      <h1 className="text-page-title">{title}</h1>
      {description && <p className="text-fg-secondary max-w-measure">{description}</p>}
      {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);
