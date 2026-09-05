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
 * A factory, not a shared constant: Vitest mutates each instance to stamp the
 * resolved project name onto it, so two projects spreading one object would
 * collide on "project name was already defined". `satisfies` rather than an
 * annotation keeps `browser: 'chromium'` a literal.
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
   * Vitest's default name uses `os.platform()`, which is `linux` on both arm64
   * and amd64 -- two architectures would overwrite each other's baselines while
   * rendering differently. With `process.arch` a mismatch fails with "no
   * reference screenshot found" instead. The per-test-file subdirectory is
   * dropped; baselines already sit in the component's folder.
   */
  resolveScreenshotPath: ({
    root,
    testFileDirectory,
    screenshotDirectory,
    arg,
    ext,
    browserName,
    platform,
  }) =>
    resolve(
      root,
      testFileDirectory,
      screenshotDirectory,
      `${arg}-${browserName}-${platform}-${process.arch}${ext}`
    ),
  resolveDiffPath: ({
    root,
    attachmentsDir,
    testFileDirectory,
    arg,
    ext,
    browserName,
    platform,
  }) =>
    resolve(
      root,
      attachmentsDir,
      testFileDirectory,
      `${arg}-${browserName}-${platform}-${process.arch}-diff${ext}`
    ),
  comparatorName: 'pixelmatch',
  comparatorOptions: {
    // Subpixel antialiasing only; widen one noisy case via `visualTest`'s
    // `screenshot` option rather than loosening it here.
    allowedMismatchedPixelRatio: 0.01,
    threshold: 0.1,
  },
}

export default defineConfig({
  test: {
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
       * `statements` and `branches` are floors, not targets: React Compiler
       * emits cache-hit/cache-miss pairs, some unreachable from a test -- a
       * rest-spread builds a fresh object every render, so its "unchanged"
       * branch can never be taken.
       */
      thresholds: { lines: 100, functions: 100, statements: 85, branches: 65 },
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
