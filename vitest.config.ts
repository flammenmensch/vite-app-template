import babel from '@rolldown/plugin-babel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

import { resolve } from 'node:path'
import { defineConfig, defineProject } from 'vitest/config'
import type { BrowserConfigOptions } from 'vitest/node'

/**
 * Tests are split three ways by filename, and the extension is the guardrail:
 *
 *   *.test.ts          -> `unit`    node, no DOM, no plugins
 *   *.browser.test.tsx -> `browser` real chromium, behaviour and a11y
 *   *.visual.test.tsx  -> `visual`  real chromium, screenshot baselines
 *
 * A unit test cannot be a `.tsx` file, so "I'll just render a component in
 * the fast project" is not reachable by accident.
 */

/**
 * The same pipeline `vite.config.ts` builds the app with, React Compiler
 * included. Without the compiler here, tests would exercise plain components
 * while production ships memoised ones -- so the code under test would not be
 * the code that ships.
 *
 * The `unit` project deliberately gets none of it: it only ever imports plain
 * `.ts`, and compiling vanilla-extract and JSX there would be pure startup
 * cost. Called per project because plugin instances are stateful.
 */
const componentPlugins = () => [
  vanillaExtractPlugin(),
  react(),
  babel({ presets: [reactCompilerPreset()] }),
]

/**
 * Vitest defaults the viewport to 414x896 (a phone). Pinned here so browser
 * and visual runs agree, and so a baseline never shifts because someone
 * resized a window.
 */
const viewport = { width: 1280, height: 720 }

/**
 * A factory, not a shared constant. Vitest expands `browser.instances` into
 * one project per instance and *mutates* each instance object to stamp the
 * resolved project name onto it. Two projects spreading the same object would
 * share the same `instances` array by reference, so the second would find the
 * name already set and fail with "project name was already defined".
 *
 * The explicit `name` also keeps the project addressable as `--project=visual`
 * rather than the generated `visual (chromium)`.
 *
 * `satisfies` rather than a return-type annotation: an annotation would widen
 * `browser: 'chromium'` to `string` and erase the literal, while `satisfies`
 * checks the shape and keeps it.
 */
const chromium = (name: string) =>
  ({
    enabled: true,
    provider: playwright(),
    headless: true,
    viewport,
    instances: [{ browser: 'chromium', name }],
  }) satisfies BrowserConfigOptions

/**
 * Derived, not hand-written. `expect.toMatchScreenshot` is a union mapped over
 * the comparator registry, and the provider package augments that registry --
 * so `comparatorOptions` is only correctly typed *relative to* the
 * `comparatorName` beside it. Reading the type back off `BrowserConfigOptions`
 * keeps that link intact: swap the comparator and the options are rechecked
 * against the new one.
 */
type ScreenshotComparison = NonNullable<
  NonNullable<BrowserConfigOptions['expect']>['toMatchScreenshot']
>

const screenshotComparison: ScreenshotComparison = {
  /**
   * Two departures from the default layout.
   *
   * `process.arch` is added because Vitest's default name is
   * `${arg}-${browser}-${platform}${ext}` and `platform` is `os.platform()` --
   * so arm64 Linux and amd64 Linux both write `-linux.png` while rendering
   * differently. With the architecture in the name, a run on the wrong one
   * fails with "no reference screenshot found" rather than silently diffing
   * against an image it was never meant to match.
   *
   * The per-test-file subdirectory is dropped. Baselines already sit in the
   * component's own folder, so `__screenshots__/Header.visual.test.tsx/` only
   * repeated what the path above it already said. Case names come from
   * `visualTest` explicitly, so they stay stable and readable without it.
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
    /**
     * A small tolerance for subpixel antialiasing, which can differ run to run
     * even on identical hardware. It is not covering for environment drift --
     * the container pins that, and the theme uses system font stacks so there
     * is no webfont load to race. Widen it for one genuinely noisy case via
     * `visualTest`'s `screenshot` option rather than loosening it here.
     */
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
        // Generated stylesheets: vanilla-extract compiles these away, so the
        // "statements" a coverage tool sees are build output, not behaviour.
        'src/**/*.css.ts',
        'src/**/*.stories.tsx',
        // Test helpers, and barrels: re-exports with no behaviour to cover.
        'src/test/**',
        'src/**/index.ts',
        // Composition root -- exercised by the browser suite, but it is a
        // `createRoot` call against a real `#root`, not a unit of behaviour.
        'src/main.tsx',
      ],
      /**
       * `lines` and `functions` are held at 100 because they measure what the
       * tests actually reach.
       *
       * `statements` and `branches` are floors, not targets. React Compiler
       * rewrites each component around a memo cache, turning every prop read
       * into a cache-hit/cache-miss pair, and some of those pairs are
       * unreachable from a test -- a rest-spread builds a fresh object on
       * every render, so its "unchanged" branch can never be taken. Demanding
       * 100 here would be demanding coverage of generated code: it buys
       * nothing and fails the gate every time a component is added. These
       * floors sit just under the current 88% / 70%, so a real regression
       * still trips them.
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
