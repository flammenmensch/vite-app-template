import { createGlobalTheme, globalStyle, layer } from '@vanilla-extract/css'

const global = layer('global')

/**
 * A theme contract: generic slots meant to be replaced, where the shape is the
 * part worth keeping. Font stacks are system fonts so there is no webfont load
 * for a screenshot to race; re-record baselines if you add one.
 *
 * Colours come in pairs. Anything used as a surface has a matching `Foreground`
 * for the text on it, so a component that only ever uses a pair cannot produce
 * unreadable text when the palette is replaced -- which is what breaks first
 * when a second theme is added later.
 */
export const globalTheme = createGlobalTheme(':root', {
  color: {
    /** The page itself. */
    background: '#ffffff',
    /** Raised above the page: cards, panels, menus. */
    surface: '#f9fafb',
    foreground: '#171717',
    /** Secondary text. Not for text on `accent` or `danger`. */
    muted: '#6b7280',
    border: '#e5e7eb',
    /** Keyboard focus ring. Its own slot: it has to stay visible against both
     * the component it outlines and whatever sits behind it. */
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
    /** Hairlines. Pair with `color.border`. */
    thin: '1px',
    /** Emphasis: a selected control, an error outline. */
    thick: '2px',
  },
  /**
   * Elevation, not decoration -- each step should read as "further from the
   * page" than the last. These are theme values rather than constants: a dark
   * theme needs its own, since a black shadow does nothing on a dark surface.
   */
  shadow: {
    /** Resting on the page: cards, table rows. */
    sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
    /** Lifted above it: dropdowns, popovers. */
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    /** Detached from it: dialogs, sheets. */
    lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  },
  duration: {
    /** State changes on something already visible: hover, focus, checked. */
    fast: '120ms',
    /** The default for most transitions. */
    normal: '200ms',
    /** Something entering or leaving: dialogs, sheets, toasts. */
    slow: '320ms',
  },
  /**
   * Asymmetric on purpose. Things arriving should decelerate into place and
   * things leaving should accelerate away; using one symmetric curve for both
   * is what makes an interface feel sluggish on exit.
   */
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    entrance: 'cubic-bezier(0, 0, 0, 1)',
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
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

/**
 * `:focus-visible` rather than `:focus`, so the ring appears for keyboard
 * navigation without following mouse clicks around. Reset to the token so the
 * ring is themeable rather than whatever each browser draws.
 */
globalStyle(':focus-visible', {
  '@layer': {
    [global]: {
      outline: `2px solid ${globalTheme.color.focus}`,
      outlineOffset: '2px',
    },
  },
})

/**
 * Honour `prefers-reduced-motion` once, here, by collapsing the duration
 * tokens themselves. Every component that animates through them follows
 * automatically -- no media query per component, and no `!important` blanket
 * over the whole document.
 *
 * This is also the argument for motion being tokens rather than literals: a
 * hardcoded `200ms` cannot be turned off from one place.
 *
 * Deliberately NOT in the `global` layer. `createGlobalTheme` writes its
 * `:root` unlayered, and unlayered rules beat layered ones no matter where they
 * sit in the file -- inside the layer this block compiled fine, emitted real
 * CSS, and was silently ignored by the browser.
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
