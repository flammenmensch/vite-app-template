import { createGlobalTheme, globalStyle, layer } from '@vanilla-extract/css'

const global = layer('global')

/**
 * Generic slots meant to be replaced; the shape is the part worth keeping.
 *
 * Colours come in pairs: anything used as a surface has a matching
 * `Foreground`, so a component that only ever uses a pair cannot produce
 * unreadable text when the palette is replaced. `muted` is secondary text on
 * `background` or `surface` only. `focus` is its own slot because a ring has to
 * stay visible against both the control it outlines and whatever is behind it.
 *
 * Font stacks are system fonts, so no webfont load can race a screenshot.
 * Re-record baselines if you add one.
 */
export const globalTheme = createGlobalTheme(':root', {
  color: {
    background: '#ffffff',
    surface: '#f9fafb',
    foreground: '#171717',
    muted: '#6b7280',
    border: '#e5e7eb',
    focus: '#2563eb',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    danger: '#dc2626',
    dangerForeground: '#ffffff',
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
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700',
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
  borderWidth: {
    thin: '1px',
    thick: '2px',
  },
  /** Theme values, not constants: a black shadow does nothing on a dark surface. */
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  },
  duration: {
    fast: '120ms',
    normal: '200ms',
    slow: '320ms',
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
      fontWeight: globalTheme.fontWeight.bold,
      lineHeight: globalTheme.lineHeight.tight,
    },
  },
})

globalStyle(':focus-visible', {
  '@layer': {
    [global]: {
      outline: `2px solid ${globalTheme.color.focus}`,
      outlineOffset: '2px',
    },
  },
})

/**
 * Collapse the duration tokens rather than blanketing the document, so anything
 * animating through them follows automatically.
 *
 * Deliberately NOT in the `global` layer: `createGlobalTheme` writes its `:root`
 * unlayered, and unlayered rules beat layered ones wherever they sit in the
 * file. Inside the layer this compiled, emitted real CSS, and was ignored.
 */
globalStyle(':root', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      vars: {
        [globalTheme.duration.fast]: '1ms',
        [globalTheme.duration.normal]: '1ms',
        [globalTheme.duration.slow]: '1ms',
      },
    },
  },
})
