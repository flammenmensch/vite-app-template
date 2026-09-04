import { createGlobalTheme, globalStyle, layer } from '@vanilla-extract/css'

const global = layer('global')

/**
 * A theme contract: slots, not a design.
 *
 * The values are deliberately generic so a project scaffolded from this
 * template replaces them without restructuring anything. The shape is the part
 * worth keeping -- components reference `globalTheme.space.md`, and swapping
 * what `md` means is then a one-line change rather than a search across the
 * codebase.
 *
 * Font stacks are system fonts on purpose. A webfont has to load, which means
 * there is a moment where it has not, and a screenshot taken in that moment
 * records the fallback instead. Nothing to load means nothing to fall back
 * from. Add webfonts when the design calls for them, and re-record baselines
 * when you do.
 */
export const globalTheme = createGlobalTheme(':root', {
  color: {
    background: '#ffffff',
    foreground: '#171717',
    muted: '#6b7280',
    border: '#e5e7eb',
    accent: '#2563eb',
  },
  font: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    full: '9999px',
  },
})

globalStyle('html', {
  '@layer': {
    [global]: {
      fontFamily: globalTheme.font.body,
      backgroundColor: globalTheme.color.background,
      color: globalTheme.color.foreground,
    },
  },
})

globalStyle('body', {
  '@layer': {
    [global]: {
      fontSize: globalTheme.fontSize.md,
      lineHeight: globalTheme.lineHeight.normal,
    },
  },
})

globalStyle('h1, h2, h3, h4, h5, h6', {
  '@layer': {
    [global]: {
      fontFamily: globalTheme.font.heading,
      lineHeight: globalTheme.lineHeight.tight,
    },
  },
})
