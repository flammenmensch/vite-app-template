import type { ReactNode } from 'react'

import { expect, test } from 'vitest'
import type { RenderResult } from 'vitest-browser-react'
import { render } from 'vitest-browser-react'
import type { ScreenshotMatcherOptions } from 'vitest/browser'

import { settle } from './settle'

/**
 * A story case: the zero-argument component exports in a `.stories.tsx` file.
 * Stories are already the canonical list of states a component can be in, so
 * visual cases are written by pointing at them rather than by rebuilding the
 * same list a second time.
 */
export type StoryCase = () => ReactNode

export type VisualTestOptions = {
  /**
   * Interactions to run before the screenshot -- hover, open a menu, focus an
   * input. Receives the render result, so locators and `userEvent` are
   * available. The page is settled before this runs and again after, so steps
   * neither act on a half-laid-out page nor get captured mid-transition.
   */
  steps?: (screen: RenderResult) => Promise<void> | void
  /**
   * Per-case comparison overrides, merged over the project defaults in
   * `vitest.config.ts`. Use for a case that is legitimately noisier than the
   * rest -- a gradient, an animation that cannot be frozen -- rather than
   * loosening the threshold for everything.
   *
   *     visualTest('gradient', stories.Gradient, {
   *       screenshot: {
   *         comparatorName: 'pixelmatch',
   *         comparatorOptions: { allowedMismatchedPixelRatio: 0.05 },
   *       },
   *     })
   */
  screenshot?: ScreenshotMatcherOptions
  /** Overrides the Vitest timeout for this case. */
  timeout?: number
}

type TestRunner = typeof test | typeof test.skip | typeof test.only

const defineVisualTest =
  (runner: TestRunner) =>
  (name: string, Story: StoryCase, options: VisualTestOptions = {}) => {
    runner(
      name,
      async () => {
        const screen = await render(<Story />)
        await settle()

        await options.steps?.(screen)
        await settle()

        /**
         * The container, not the page: a baseline should be the size of the
         * component rather than mostly empty viewport, so a diff points at what
         * actually changed.
         *
         * `name` is passed explicitly so the baseline filename is the case name
         * instead of an auto-generated, position-dependent one -- reordering
         * tests must not rename files.
         */
        await expect(screen.container).toMatchScreenshot(
          name,
          options.screenshot
        )
      },
      options.timeout
    )
  }

/**
 * Register one visual regression case.
 *
 *     import { visualTest } from '#test/visual'
 *     import * as stories from './Header.stories'
 *
 *     visualTest('default', stories.Default)
 *
 * `.skip` and `.only` behave as they do on Vitest's `test`.
 */
export const visualTest = Object.assign(defineVisualTest(test), {
  skip: defineVisualTest(test.skip),
  only: defineVisualTest(test.only),
})
