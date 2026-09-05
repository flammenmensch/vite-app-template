import { globalStyle, layer } from '@vanilla-extract/css'

const reset = layer('reset')

globalStyle('*, *::before, *::after', {
  '@layer': {
    [reset]: {
      boxSizing: 'border-box',
    },
  },
})

globalStyle('*:not(dialog)', {
  '@layer': {
    [reset]: {
      margin: 0,
    },
  },
})

globalStyle('html', {
  '@layer': {
    [reset]: {
      '@media': {
        '(prefers-reduced-motion: no-preference)': {
          interpolateSize: 'allow-keywords',
        },
      },
    },
  },
})

globalStyle('body', {
  '@layer': {
    [reset]: {
      lineHeight: 1.5,
      WebkitFontSmoothing: 'antialiased',
    },
  },
})

globalStyle('img, picture, video, canvas, svg', {
  '@layer': {
    [reset]: {
      display: 'block',
      maxWidth: '100%',
    },
  },
})

globalStyle('input, button, textarea, select', {
  '@layer': {
    [reset]: {
      font: 'inherit',
    },
  },
})

globalStyle('p, h1, h2, h3, h4, h5, h6', {
  '@layer': {
    [reset]: {
      overflowWrap: 'break-word',
    },
  },
})

globalStyle('p', {
  '@layer': {
    [reset]: {
      textWrap: 'pretty',
    },
  },
})

globalStyle('h1, h2, h3, h4, h5, h6', {
  '@layer': {
    [reset]: {
      textWrap: 'balance',
    },
  },
})

globalStyle('#root, #__next', {
  '@layer': {
    [reset]: {
      isolation: 'isolate',
    },
  },
})
