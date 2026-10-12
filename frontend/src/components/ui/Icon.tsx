import React from 'react';

/* A deliberately small icon set: drawn on a 20px grid with a 1.5 stroke, used only where an
   icon carries meaning (menu, theme, refresh, search, sort, alerts). */
const PATHS = {
  menu: 'M3 5.5h14M3 10h14M3 14.5h14',
  close: 'M5 5l10 10M15 5L5 15',
  refresh: 'M16 10a6 6 0 1 1-1.76-4.24M16 4v3.5h-3.5',
  search: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM17 17l-3.75-3.75',
  sun: 'M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.3 4.3l1.1 1.1M14.6 14.6l1.1 1.1M4.3 15.7l1.1-1.1M14.6 5.4l1.1-1.1',
  moon: 'M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7z',
  system: 'M3 4.5h14v9H3zM7.5 16.5h5M10 13.5v3',
  sortAsc: 'M10 4l4 5H6zM6 12h8',
  sortDesc: 'M10 16l-4-5h8zM6 8h8',
  sort: 'M10 3.5l3.5 4h-7zM10 16.5l-3.5-4h7z',
  alert: 'M10 3l7.5 13h-15zM10 8v3.5M10 13.75v.25',
  chevronRight: 'M8 5l5 5-5 5',
  arrowLeft: 'M16 10H4M8.5 5.5L4 10l4.5 4.5',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  label?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, label, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    focusable="false"
    {...rest}
  >
    <path d={PATHS[name]} />
  </svg>
);
