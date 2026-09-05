# vite-app-template

An opinionated application template: **Vite + React 19 + vanilla-extract**, with
a three-tier test setup and visual regression pinned to a container so baselines
mean the same thing on every machine.

- **Vite 8** with the React Compiler enabled — in the app build _and_ in tests
- **vanilla-extract** for typed, zero-runtime styling
- **Vitest 5** across three projects: unit, browser, and visual
- **Ladle** for component development
- **oxlint + oxfmt** for linting and formatting
- **Husky + commitlint** for conventional commits

## Using this template

Create a repository from it with GitHub's **Use this template** button, or:

```sh
gh repo create my-app --template flammenmensch/vite-app-template
# or, without GitHub:
npx degit flammenmensch/vite-app-template my-app
```

Then make it yours:

```sh
cd my-app
pnpm install
pnpm run init      # prompts for name, author, repo; rewrites metadata, then removes itself
```

`init` also initialises a git repository and installs the commit hooks. That has
to happen here rather than during `pnpm install`, because husky's `prepare` step
needs `.git` to already exist and `degit` gives you a directory without one — it
exits quietly in that case, and nothing re-runs it afterwards, not even a later
`git init`. Skipping `init` therefore leaves you with no lint-staged and no
commitlint, and nothing to tell you. If you do skip it, run `git init` followed
by `pnpm run prepare` yourself.

`init` rewrites `package.json`, the `index.html` title, and this README. The
visual baselines it leaves behind belong to the template's `Header`, so
re-record them once your own components exist:

```sh
pnpm test:visual:update
```

## Getting started

```sh
pnpm install
pnpm exec playwright install chromium   # for the browser test suite
pnpm start
```

Requires Node `>=24.11.0` (see `.nvmrc`) and pnpm 11. Docker is needed only for
visual regression.

## Scripts

| Script                      | Does                                    |
| --------------------------- | --------------------------------------- |
| `pnpm start`                | Dev server                              |
| `pnpm start:ladle`          | Component workbench                     |
| `pnpm build`                | Typecheck, then production build        |
| `pnpm lint` / `pnpm format` | oxlint / oxfmt                          |
| `pnpm test`                 | Watch unit + browser                    |
| `pnpm test:run`             | Single run, unit + browser              |
| `pnpm test:coverage`        | Unit + browser with coverage thresholds |
| `pnpm test:visual`          | Visual regression, in Docker            |
| `pnpm test:visual:update`   | Re-record baselines, in Docker          |
| `pnpm test:all`             | Everything CI runs                      |

## Project structure

```
src/
  components/
    Header/
      Header.tsx                  component
      Header.css.ts               vanilla-extract styles
      Header.stories.tsx          Ladle story
      Header.browser.test.tsx     behaviour, in a real browser
      Header.visual.test.tsx      screenshot baseline
      __screenshots__/            committed baselines
      index.ts                    barrel
  styles/                         reset + global theme
  utils/
test/                             shared test setup and helpers
```

Test helpers live in `test/` at the repo root rather than inside `src/`, and are
imported as `#test/...` through the `imports` field in `package.json` (mirrored
by `paths` in `tsconfig.app.json`, which TypeScript needs spelled out
separately). Test _files_ stay next to the code they cover.

## Testing

Three Vitest projects, defined together in `vitest.config.ts`. Which one a test
lands in is decided by its filename:

| File                 | Project   | Runs in                                                    |
| -------------------- | --------- | ---------------------------------------------------------- |
| `*.test.ts`          | `unit`    | Node. No DOM, no plugins, no browser.                      |
| `*.browser.test.tsx` | `browser` | Real Chromium, via Playwright.                             |
| `*.visual.test.tsx`  | `visual`  | Chromium **inside Docker**, against a screenshot baseline. |

A unit test cannot be a `.tsx` file. That is deliberate: with vanilla-extract, a
component rendered outside a browser gets a class name that resolves to no
stylesheet, so anything you assert about its appearance would be fiction.
Component tests belong in a real browser.

### Why the compiler runs in tests

`vitest.config.ts` applies the same plugin chain as `vite.config.ts`, React
Compiler included. Without it, tests would exercise plain components while
production ships memoised ones — the code under test would not be the code that
ships.

This has a visible consequence in coverage: the compiler wraps each component in
a memo cache, so every prop read becomes a cache-hit/cache-miss branch pair. A
first render only ever takes the miss path, which is why components have
re-render tests. Some pairs stay unreachable regardless — a rest-spread builds a
fresh object every render, so its "unchanged" branch can never be taken. The
`statements` and `branches` thresholds are therefore floors rather than 100%;
`lines` and `functions` are held at 100.

## Visual regression

Visual tests run **only in Docker**, pinned to `linux/amd64`. That is the whole
point: a baseline should record what a component looks like, not what it looks
like on the machine that happened to record it.

```sh
pnpm test:visual          # compare against committed baselines
pnpm test:visual:update   # re-record after an intended change
pnpm test:visual:shell    # interactive shell in the container
```

On Apple Silicon, emulated amd64 is slow and unreliable under Colima's QEMU
backend (pnpm's threaded I/O trips a libuv assertion). Run natively instead:

```sh
VISUAL_PLATFORM=linux/arm64 pnpm test:visual
```

Baselines carry `process.arch`, so arm64 and amd64 sets sit side by side and can
never be compared against each other by mistake. CI always uses the amd64
default. If you only have arm64 baselines, run the **Record visual baselines**
workflow (`workflow_dispatch`) to produce amd64 ones and commit the artifact.

Baselines live directly in `__screenshots__/` next to the test — one file per
case, no per-test-file subdirectory — and **are committed**;
the baseline is the assertion, so it belongs in review alongside the change that
moves it. Failure diffs are written to `.vitest/attachments/` and ignored by git;
CI uploads them as an artifact.

### Why the architecture is pinned

Vitest names baselines `${arg}-${browser}-${platform}${ext}`, where `platform`
comes from `os.platform()` — so arm64 Linux and amd64 Linux both write
`-linux.png` while rendering differently. This template adds `process.arch` via
`resolveScreenshotPath`, and pins the container to `linux/amd64` to match
standard CI runners. On Apple Silicon the container is emulated and therefore
slower, but its output is byte-identical to CI. If the pin is ever lost, you get
a clean "no reference screenshot found" failure rather than a mystery diff.

CI runs the same container even though its runners are already amd64 Linux:
matching the architecture is not sufficient, because font packages and freetype
versions differ between the runner image and the container, and both change
glyph rasterisation.

### Writing a visual test

Visual cases point at the component's Ladle stories, so there is no second list
of states to keep in sync:

```tsx
import { visualTest } from '#test/visual'

import * as stories from './Header.stories'

visualTest('default', stories.Default)
visualTest('with custom class', stories.WithCustomClass)
```

`visualTest(name, story, options?)` renders the story, waits for webfonts and
layout to settle, and captures the component's container rather than the whole
viewport.

The theme in `src/styles/global.css.ts` uses system font stacks, so there is no
webfont load for a screenshot to race. If you add webfonts, re-record every
baseline once they are in place. The name becomes the baseline filename, so reordering tests never
renames files. `visualTest.skip` and `visualTest.only` work as on Vitest's
`test`.

`options` covers the cases where one story needs to behave differently:

```tsx
visualTest('menu open', stories.Default, {
  // Interact before capturing. Runs after the page settles, and the page
  // settles again afterwards, so steps neither act on a half-laid-out page nor
  // get captured mid-transition.
  steps: async (screen) => {
    await screen.getByRole('button', { name: 'Open' }).click()
  },
  // Merged over the project defaults in vitest.config.ts. Use this for a case
  // that is genuinely noisier -- a gradient, an unfreezable animation --
  // instead of loosening the threshold for everything.
  screenshot: {
    comparatorName: 'pixelmatch',
    comparatorOptions: { allowedMismatchedPixelRatio: 0.05 },
  },
  timeout: 10_000,
})
```

`src/test/setup.visual.ts` additionally freezes animations, transitions, and the
text caret for every visual test.

A first run with no baseline **fails** and writes the reference. That is
intended: review the image, then commit it. In CI a missing baseline stays a
failure rather than quietly recording whatever the component happens to render.

## Supply chain

`pnpm-workspace.yaml` sets `minimumReleaseAge: 1440` — no dependency version
published in the last 24 hours will install. Compromised-maintainer releases are
usually caught and unpublished within hours, so not being first to install is
most of the defence.

There is deliberately **no `minimumReleaseAgeExclude`**. When an install is
blocked, pnpm offers to add the flagged package to that list; accepting disables
the policy for exactly the package it was protecting you from. Wait instead — a
blocked install clears on its own.

`allowBuilds` lists the transitive packages permitted to run install scripts.
Adding to it should be a deliberate decision, not a reflex.

## CI

`.github/workflows/ci.yml` runs four jobs on every push and pull request:
**quality** (oxlint, oxfmt, `tsc -b`), **test** (unit + browser + coverage),
**visual** (the container), and **build** (app + Ladle).

## License

MIT © Alexey Protasov
