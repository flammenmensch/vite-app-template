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

  /**
   * Asserting both classes at once is the point: a `cn(styles.root, className)`
   * accidentally rewritten as `className ?? styles.root` still passes a test
   * that only looks for `custom`.
   */
  await expect
    .element(screen.getByRole('heading', { level: 1 }))
    .toHaveClass(styles.root, 'custom')
})

test('reuses memoised output across renders with equal props', async () => {
  /**
   * React Compiler rewrites the component around a memo cache, so every prop
   * read becomes a `cache hit / cache miss` pair of branches. A first render
   * only ever takes the miss path.
   *
   * Re-rendering with identical props exercises the hit path, and re-rendering
   * with changed props proves the cache actually invalidates rather than
   * pinning the first value forever.
   */
  const screen = await render(<Header className="first" />)
  const heading = screen.getByRole('heading', { level: 1 })

  await screen.rerender(<Header className="first" />)
  await expect.element(heading).toHaveClass(styles.root, 'first')

  await screen.rerender(<Header className="second" />)
  await expect.element(heading).toHaveClass(styles.root, 'second')
  await expect.element(heading).not.toHaveClass('first')

  // Same className, different other prop: the compiler's guard is a chain of
  // `||` comparisons, so this is the only way to reach the operands after the
  // first one.
  await screen.rerender(<Header className="second" id="renamed" />)
  await expect.element(heading).toHaveAttribute('id', 'renamed')
})
