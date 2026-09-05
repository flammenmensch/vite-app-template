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

`pnpm install` prints these next steps itself on a fresh scaffold, because degit
cannot run them for you: its actions are `clone`, `search_replace` and `remove`
only, by design, since it copies untrusted repositories.

`init` fills its prompts in from the machine the way `npm init` does — the name
from the directory, the author from npm's `init-author-*` settings or `git
config user.name`/`user.email`, and the repository from git's `origin` when
there is one. Press enter to accept a default. It also takes answers on stdin,
in prompt order, for scripted setup.

A scaffold keeps the `Header` component and its recorded baselines, so
`pnpm test:visual` passes on a fresh checkout and you can see the whole visual
workflow work before changing anything. Once you replace `Header` with your own
components, record your own baselines with `pnpm test:visual:update`.

`init` also initialises a git repository and installs the commit hooks. That has
to happen here rather than during `pnpm install`, because husky needs `.git` to
already exist, and a `degit` scaffold has no repository yet. Skipping `init`
therefore leaves you without lint-staged and commitlint — run `git init` and
then `pnpm install` again to pick them up.

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

Requires Node `>=24.20.0` (see `.nvmrc`) and pnpm 11. Docker is needed only for
visual regression.

## Scripts

| Script                      | Does                                   |
| --------------------------- | -------------------------------------- |
| `pnpm start`                | Dev server                             |
| `pnpm start:ladle`          | Component workbench                    |
| `pnpm build`                | Typecheck, then production build       |
| `pnpm lint` / `pnpm format` | oxlint / oxfmt                         |
| `pnpm test`                 | Watch unit + browser                   |
| `pnpm test:run`             | Single run, unit + browser             |
| `pnpm test:coverage`        | Unit + browser, with a coverage report |
| `pnpm test:visual`          | Visual regression, in Docker           |
| `pnpm test:visual:update`   | Re-record baselines, in Docker         |
| `pnpm test:all`             | Everything CI runs                     |

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

Every test command passes when it finds nothing to run (`passWithNoTests`), so a
project that has deleted the examples — or has not written a browser or visual
test yet — still gets a green build rather than "No test files found".

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
fresh object every render, so its "unchanged" branch can never be taken. Keep
that in mind if you add coverage thresholds: `statements` and `branches` need
slack that `lines` and `functions` do not.

The template ships **no thresholds**. A scaffold starts with no tests of its
own, and any non-zero floor would fail it — as would the first component you
write before testing it. Coverage is still measured, printed, and uploaded by
CI; add a floor in `vitest.config.ts` once you have a suite worth holding to
one.

## Visual regression

Visual tests run **only in Docker**. That is the whole point: a baseline should
record what a component looks like, not what it looks like on the machine that
happened to record it.

```sh
pnpm test:visual          # compare against committed baselines
pnpm test:visual:update   # re-record after an intended change
pnpm test:visual:shell    # interactive shell in the container
```

The container uses **your host's architecture** by default, and baselines for
both amd64 and arm64 are committed, so this works out of the box either way.
Baselines carry `process.arch` in their filename, so the two sets sit side by
side and can never be compared against each other by mistake.

CI pins `VISUAL_PLATFORM=linux/amd64` explicitly. To reproduce a CI failure
locally on Apple Silicon you need Rosetta, because under QEMU emulation Node
aborts inside libuv before any test runs:

```sh
colima start --vm-type=vz --vz-rosetta   # once
VISUAL_PLATFORM=linux/amd64 pnpm test:visual
```

If you add a component on arm64, you will have an arm64 baseline and CI will
fail with "no reference screenshot found" for amd64. Run the **Record visual
baselines** workflow (`workflow_dispatch`), download the artifact, and commit
the PNGs.

### Troubleshooting

**`exit code: 134` during `pnpm install` in the container.** That is `SIGABRT`,
and the real cause is the line Docker's summary scrolls past:

```
node: ../deps/uv/src/unix/linux.c:1427: uv__io_poll: Assertion `errno == EEXIST' failed.
```

You are running an amd64 container on an arm64 host under QEMU, whose syscall
emulation returns an `errno` libuv asserts cannot happen. The install itself
succeeded; Node aborted afterwards. Either drop the `VISUAL_PLATFORM=linux/amd64`
override to run natively, or enable Rosetta as above.

Baselines live directly in `__screenshots__/` next to the test — one file per
case, no per-test-file subdirectory — and **are committed**;
the baseline is the assertion, so it belongs in review alongside the change that
moves it. Failure diffs are written to `.vitest/attachments/` and ignored by git;
CI uploads them as an artifact.

### Why the architecture is in the filename

Vitest names baselines `${arg}-${browser}-${platform}${ext}`, where `platform`
comes from `os.platform()` — so arm64 Linux and amd64 Linux both write
`-linux.png` while rendering differently. This template adds `process.arch` via
`resolveScreenshotPath`, so the two never collide. A run on an architecture
with no committed baseline fails with a clean "no reference screenshot found"
rather than a mystery diff — which is why running natively is safe to default
to.

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
```

`visualTest(name, story, options?)` renders the story, waits for fonts and
layout to settle, and captures the component's container rather than the whole
viewport.

The theme uses system font stacks, so there is no webfont load for a screenshot
to race. If you add webfonts, re-record every baseline once they are in place. The name becomes the baseline filename, so reordering tests never
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
pnpm blocks every dependency lifecycle script unless it is named there, and the
list holds exactly the three that need one — `@swc/core`, `esbuild` and `msw`,
each unpacking a prebuilt native binary. Note that `prepare` and `prepublish`
never run for registry dependencies, so the audited surface really is those
three. Adding to the list should be a deliberate decision, not a reflex.

`.ncurc.js` derives `ncu`'s `--cooldown` from the same `minimumReleaseAge`
value, so `npx npm-check-updates` never offers a version `pnpm install` would
then refuse. It is read from `pnpm-workspace.yaml` rather than repeated, so the
two cannot drift apart. `.github/dependabot.yml` sets the same cooldown for the
same reason.

`packageManager` carries a corepack integrity hash, so pnpm itself is verified
against a known digest the first time a machine downloads it — a cached copy is
not re-checked, which is why the pin matters most on fresh CI runners. Change it
with `corepack use pnpm@<version>`, never by hand.

Dependabot watches npm, the workflow actions (pinned to SHAs, so nothing else
would ever advance them), and Docker images — but it is told to leave the
Dockerfile's `node` image alone. That version is deliberately the same one as
`.nvmrc`, and moving Node is a coordinated edit across `.nvmrc`, the Dockerfile
and `engines.node`, followed by re-recording every visual baseline, so it stays
a human decision.

Security policy and how to report something: [SECURITY.md](SECURITY.md).

## What runs on your machine

Everything this template executes for you, and why it is safe to let it:

| when               | what runs                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`     | `scripts/postinstall.mjs` (prints next steps), `scripts/prepare.mjs` (installs git hooks, only if `.git` exists), and the install scripts of the three packages in `allowBuilds` |
| `git commit`       | `.husky/pre-commit` → lint-staged → oxlint/oxfmt; `.husky/commit-msg` → commitlint                                                                                               |
| `pnpm run init`    | reads `git config`/`npm config` for defaults, runs `git init` and husky, rewrites metadata, deletes `scripts/`                                                                   |
| `pnpm test:visual` | Docker builds and runs the container in `compose.yaml`                                                                                                                           |

The scripts in `scripts/` spawn commands only through `execFileSync` with an
argument array and never `shell: true`, so nothing you type at a prompt reaches
a shell. The project name is validated against the npm naming rules before it is
written anywhere.

Nothing in the app loads code from a CDN — `index.html` references only local
sources — and the dev server keeps Vite's default of binding localhost.

The visual container runs as root over a read-write bind mount of the project,
so `compose.yaml` masks `.git` and `.husky` with empty volumes. Without that, a
compromised test-time dependency could write a git hook that then executes on
the host at your next commit — a host escape needing no container escape.

If you add environment variables, remember that Vite **inlines every `VITE_`
prefixed variable into the client bundle**. Those are public. Secrets belong on
a server, and `.env` files are gitignored here.

## CI

`.github/workflows/ci.yml` runs four jobs on every push and pull request:
**quality** (oxlint, oxfmt, `tsc -b`), **test** (unit + browser + coverage),
**visual** (the container), and **build** (app + Ladle).

Workflows hold `permissions: contents: read`, trigger on `pull_request` rather
than `pull_request_target` (so fork PRs get no secrets), pin every action to a
commit SHA rather than a movable tag, and pass `persist-credentials: false` to
`actions/checkout` so the job token never lands in `.git/config` where a later
step could read it. No workflow interpolates `github.event` data into a shell.

## License

MIT © Alexey Protasov
