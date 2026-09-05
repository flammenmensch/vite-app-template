/**
 * Wait for the page to stop changing on its own, so the next screenshot is
 * reproducible. Must run inside the test body: fonts and images are only
 * requested once the component that needs them mounts.
 */
export const settle = async () => {
  await document.fonts.ready
  await new Promise(requestAnimationFrame)
}
