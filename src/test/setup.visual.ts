import { beforeAll } from 'vitest'

// A transition caught mid-flight, a spinner, or a blinking caret gives a
// different image on every run.
const FREEZE_MOTION = `
  *, *::before, *::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-delay: -1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
`

beforeAll(() => {
  const style = document.createElement('style')
  style.dataset.visualTest = 'freeze-motion'
  style.textContent = FREEZE_MOTION
  document.head.append(style)
})
