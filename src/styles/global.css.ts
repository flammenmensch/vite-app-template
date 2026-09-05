import { createGlobalTheme, globalStyle, layer } from '@vanilla-extract/css'

const global = layer('global')

/**
 * A theme contract: generic slots meant to be replaced, where the shape is the
 * part worth keeping. Font stacks are system fonts so there is no webfont load
 * for a screenshot to race; re-record baselines if you add one.
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
