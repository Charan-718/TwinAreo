import React from 'react';

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

/**
 * Hollywood Hacker Cyber Deck Page Header
 * Features angular Chakra Petch typography, terminal eyebrow indicators,
 * and tech metadata badges.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  meta,
}) => (
  <header className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-line pb-4">
    <div className="min-w-0 space-y-2">
      {eyebrow && (
        <div className="label flex items-center gap-2 text-primary/80">
          <span className="w-1.5 h-1.5 bg-primary rotate-45 inline-block" />
          <span className="tracking-[0.16em]">{eyebrow}</span>
          <span className="text-primary/40 text-[10px]">&gt;&gt;</span>
        </div>
      )}
      <h1
        className="text-page-title font-display font-black tracking-wide text-fg uppercase"
        style={{ textShadow: '0 0 12px rgba(0, 255, 157, 0.25)' }}
      >
        {title}
      </h1>
      {description && (
        <p className="text-xs md:text-sm text-fg-secondary max-w-measure leading-normal font-mono">
          {description}
        </p>
      )}
      {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);
