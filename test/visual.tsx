import type { ReactNode } from 'react'

import { expect, test } from 'vitest'
import type { RenderResult } from 'vitest-browser-react'
import { render } from 'vitest-browser-react'
import type { ScreenshotMatcherOptions } from 'vitest/browser'

import { settle } from './settle'

/** A Ladle story: a zero-argument component export. */
export type StoryCase = (() => ReactNode) & { storyName?: string }

export type VisualTestOptions = {
  /** Interactions to run before capture. The page settles either side. */
  steps?: (screen: RenderResult) => Promise<void> | void
  /** Per-case comparison overrides, merged over the project defaults. */
  screenshot?: ScreenshotMatcherOptions
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

        // The container, not the page, so a baseline is the size of the
        // component. `name` is explicit so reordering tests cannot rename
        // baseline files.
        await expect(screen.container).toMatchScreenshot(
          name,
          options.screenshot
        )
      },
      options.timeout
    )
  }

/**
 * Register a visual regression case from a Ladle story, so stories stay the
 * single list of states a component can be in.
 *
 *     visualTest('default', stories.Default)
 */
export const visualTest = Object.assign(defineVisualTest(test), {
  skip: defineVisualTest(test.skip),
  only: defineVisualTest(test.only),
})
