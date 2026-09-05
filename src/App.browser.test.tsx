import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import App from './App'

test('mounts the application shell', async () => {
  const screen = await render(<App />)

  await expect.element(screen.getByRole('heading', { level: 1 })).toBeVisible()
})

test('is stable across re-renders', async () => {
  // Covers the React Compiler cache-hit path for the app root.
  const screen = await render(<App />)
  await screen.rerender(<App />)

  await expect.element(screen.getByRole('heading', { level: 1 })).toBeVisible()
})
