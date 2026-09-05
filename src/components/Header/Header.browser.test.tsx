import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Header } from './Header'

import * as styles from './Header.css'

test('renders as a level-one heading', async () => {
  const screen = await render(<Header />)

  await expect
    .element(screen.getByRole('heading', { level: 1 }))
    .toHaveTextContent('Vite App Template')
})

test('merges a caller className with its own styles', async () => {
  const screen = await render(<Header className="custom" />)

  // Asserting both classes catches `className ?? styles.root`, which a test
  // looking only for `custom` would pass.
  await expect
    .element(screen.getByRole('heading', { level: 1 }))
    .toHaveClass(styles.root, 'custom')
})

test('reuses memoised output across renders with equal props', async () => {
  // React Compiler wraps the component in a memo cache, so every prop read
  // becomes a cache-hit/cache-miss pair. A first render only takes the miss
  // path; re-rendering covers the hit path and proves the cache invalidates.
  const screen = await render(<Header className="first" />)
  const heading = screen.getByRole('heading', { level: 1 })

  await screen.rerender(<Header className="first" />)
  await expect.element(heading).toHaveClass(styles.root, 'first')

  await screen.rerender(<Header className="second" />)
  await expect.element(heading).toHaveClass(styles.root, 'second')
  await expect.element(heading).not.toHaveClass('first')

  await screen.rerender(<Header className="second" id="renamed" />)
  await expect.element(heading).toHaveAttribute('id', 'renamed')
})
