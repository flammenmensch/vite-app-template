/**
 * Wait for the page to stop changing on its own, so a screenshot taken next
 * is reproducible.
 *
 * Call this after rendering and before `toMatchScreenshot`. It is not enough
 * to wait once in a global `beforeAll`: a font is only requested when the
 * component that asks for it mounts, which happens inside the test body.
 */
export const settle = async () => {
  await document.fonts.ready
  // One frame, so style and layout have been recomputed before we capture.
  await new Promise(requestAnimationFrame)
}
