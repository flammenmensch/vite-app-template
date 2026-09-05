import babel from '@rolldown/plugin-babel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

import { resolve } from 'node:path'
import { defineConfig, defineProject } from 'vitest/config'
import type { BrowserConfigOptions } from 'vitest/node'

/**
 * Filename decides the project:
 *
 *   *.test.ts          -> `unit`    node, no DOM
 *   *.browser.test.tsx -> `browser` real chromium
 *   *.visual.test.tsx  -> `visual`  real chromium, screenshot baselines
 *
 * A unit test cannot be `.tsx`, so a component cannot be rendered outside a
 * browser -- where vanilla-extract class names resolve to no stylesheet.
 */

/** Must match `vite.config.ts`, or tests exercise uncompiled components. */
const componentPlugins = () => [
  vanillaExtractPlugin(),
  react(),
  babel({ presets: [reactCompilerPreset()] }),
]

/** Vitest defaults to a 414x896 phone viewport. */
const viewport = { width: 1280, height: 720 }

/**
 * A factory, not a shared constant: Vitest stamps the resolved project name
 * onto each instance, so two projects spreading one object collide on "project
 * name was already defined". `satisfies` keeps `browser: 'chromium'` a literal.
 */
const chromium = (name: string) =>
  ({
    enabled: true,
    provider: playwright(),
    headless: true,
    viewport,
    instances: [{ browser: 'chromium', name }],
  }) satisfies BrowserConfigOptions

/** Derived so `comparatorOptions` stays checked against `comparatorName`. */
type ScreenshotComparison = NonNullable<
  NonNullable<BrowserConfigOptions['expect']>['toMatchScreenshot']
>

const screenshotComparison: ScreenshotComparison = {
  /**
   * One baseline per case, in the component's own `__screenshots__/`. Vitest's
   * default adds a per-test-file subdirectory and a `${platform}` segment; both
   * are dropped, since these tests only ever run in the container. `browserName`
   * stays, or a second browser instance would overwrite the first.
   */
  resolveScreenshotPath: ({
    root,
    testFileDirectory,
    screenshotDirectory,
    arg,
    ext,
    browserName,
  }) =>
    resolve(
      root,
      testFileDirectory,
      screenshotDirectory,
      `${arg}-${browserName}${ext}`
    ),
  resolveDiffPath: ({
    root,
    attachmentsDir,
    testFileDirectory,
    arg,
    ext,
    browserName,
  }) =>
    resolve(
      root,
      attachmentsDir,
      testFileDirectory,
      `${arg}-${browserName}-diff${ext}`
    ),
  comparatorName: 'pixelmatch',
  comparatorOptions: {
    /**
     * pixelmatch's default, and antialiasing slack for anything you are likely
     * to build: ordinary UI measured byte-identical between arm64 and amd64 in
     * this container. It only carries weight under heavy compositing, where the
     * two diverged in 14.93% of pixels but never perceptibly. README has the
     * numbers. Widen one noisy case via `visualTest`'s `screenshot` option
     * rather than loosening this globally.
     */
    allowedMismatchedPixelRatio: 0.01,
    threshold: 0.1,
  },
}

export default defineConfig({
  test: {
    /** A scaffold deletes these examples, and may never add a visual test. */
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '.vitest/coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.css.ts',
        'src/**/*.stories.tsx',
        'src/test/**',
        'src/**/index.ts',
        'src/main.tsx',
      ],
      /**
       * No thresholds: a scaffold starts with no tests, and any non-zero floor
       * fails it. If you add one, `statements` and `branches` need slack that
       * `lines` and `functions` do not -- the React Compiler emits
       * cache-hit/cache-miss pairs, some unreachable from any test.
       */
    },
    projects: [
      defineProject({
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.{browser,visual}.test.ts'],
        },
      }),
      defineProject({
        plugins: componentPlugins(),
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.browser.ts'],
          browser: chromium('browser'),
        },
      }),
      defineProject({
        plugins: componentPlugins(),
        test: {
          name: 'visual',
          include: ['src/**/*.visual.test.{ts,tsx}'],
          setupFiles: [
            './src/test/setup.browser.ts',
            './src/test/setup.visual.ts',
          ],
          browser: {
            ...chromium('visual'),
            expect: { toMatchScreenshot: screenshotComparison },
          },
        },
      }),
    ],
  },
})
