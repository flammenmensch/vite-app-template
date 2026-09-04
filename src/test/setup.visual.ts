import { beforeAll } from 'vitest'

/**
 * Screenshot determinism. Everything here removes a source of frame-to-frame
 * variance that would otherwise surface as a phantom diff.
 *
 * This covers what can be done once per file. The per-test half -- waiting for
 * fonts and layout after a render -- lives in `settle()`, because it has to run
 * inside the test body.
 */

/**
 * Freeze anything that moves. A transition caught mid-flight, a spinner, or a
 * blinking text caret each produce a different image on every run.
 */
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
