/* Tailwind consumes the semantic tokens in src/styles/tokens.css; no raw palette lives here. */
const v = (name) => `var(--${name})`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: v('color-bg'),
      surface: {
        DEFAULT: v('color-surface'),
        elevated: v('color-surface-elevated'),
        interactive: v('color-surface-interactive'),
        sunken: v('color-surface-sunken'),
      },
      fg: {
        DEFAULT: v('color-text-primary'),
        secondary: v('color-text-secondary'),
        muted: v('color-text-muted'),
        inverse: v('color-text-inverse'),
      },
      line: {
        DEFAULT: v('color-border'),
        subtle: v('color-border-subtle'),
        strong: v('color-border-strong'),
      },
      primary: {
        DEFAULT: v('color-primary'),
        hover: v('color-primary-hover'),
        active: v('color-primary-active'),
        soft: v('color-primary-soft'),
        text: v('color-primary-text'),
        on: v('color-on-primary'),
      },
      accent: { DEFAULT: v('color-accent'), hover: v('color-accent-hover'), soft: v('color-accent-soft') },
      success: { DEFAULT: v('color-success'), soft: v('color-success-soft') },
      warning: { DEFAULT: v('color-warning'), soft: v('color-warning-soft') },
      danger: { DEFAULT: v('color-error'), soft: v('color-error-soft') },
      info: { DEFAULT: v('color-info'), soft: v('color-info-soft') },
      focus: v('color-focus'),
      chart: { 1: v('chart-1'), 2: v('chart-2'), 3: v('chart-3'), grid: v('chart-grid'), axis: v('chart-axis') },
    },
    fontFamily: {
      sans: v('font-family-sans'),
      mono: v('font-family-mono'),
    },
    fontSize: {
      xs: [v('font-size-xs'), { lineHeight: '1.45' }],
      sm: [v('font-size-sm'), { lineHeight: '1.5' }],
      base: [v('font-size-base'), { lineHeight: v('line-height-normal') }],
      lg: [v('font-size-lg'), { lineHeight: v('line-height-snug') }],
      xl: [v('font-size-xl'), { lineHeight: v('line-height-tight') }],
      '2xl': [v('font-size-2xl'), { lineHeight: v('line-height-tight') }],
      '3xl': [v('font-size-3xl'), { lineHeight: v('line-height-tight') }],
      'page-title': [v('font-size-page-title'), { lineHeight: v('line-height-tight') }],
      metric: [v('font-size-metric'), { lineHeight: '1' }],
    },
    borderRadius: {
      none: '0',
      sm: v('radius-sm'),
      DEFAULT: v('radius-md'),
      md: v('radius-md'),
      lg: v('radius-lg'),
      xl: v('radius-xl'),
      full: v('radius-full'),
    },
    boxShadow: {
      none: 'none',
      xs: v('shadow-xs'),
      sm: v('shadow-sm'),
      md: v('shadow-md'),
      lg: v('shadow-lg'),
    },
    extend: {
      spacing: { header: v('header-height'), sidebar: v('sidebar-width'), gutter: v('gutter') },
      maxWidth: { container: v('container-max'), prose: v('container-prose'), measure: v('measure') },
      transitionDuration: { fast: v('duration-fast'), DEFAULT: v('duration-normal'), slow: v('duration-slow') },
      transitionTimingFunction: { DEFAULT: v('ease-standard'), emphasized: v('ease-emphasized') },
    },
  },
  plugins: [],
};
