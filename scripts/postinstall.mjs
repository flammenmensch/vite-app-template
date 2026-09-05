#!/usr/bin/env node
/**
 * Print next steps after a scaffold.
 *
 * degit cannot run commands -- its actions are `clone`, `search_replace` and
 * `remove`, deliberately, since it copies untrusted repositories. `pnpm install`
 * is therefore the first thing that runs in a fresh scaffold, and the only
 * place to say what to do next.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { env } from 'node:process'

const root = resolve(import.meta.dirname, '..')

/** `init` deletes this directory, so its presence means setup is unfinished. */
const isFreshScaffold = existsSync(resolve(root, 'scripts', 'init.mjs'))

/** True when this is the template repository, not a project made from it. */
const isTemplateItself = () => {
  try {
    const origin = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    })
    return origin.includes('flammenmensch/vite-app-template')
  } catch {
    return false
  }
}

if (isFreshScaffold && !env.CI && !isTemplateItself()) {
  console.log(
    [
      '',
      '  Almost there. Next steps:',
      '',
      '    pnpm run init                          name it, init git, install hooks',
      '    pnpm exec playwright install chromium  for the browser test suite',
      '    pnpm start',
      '',
      '  Until `init` runs, this project is still named after the template and',
      '  has no git hooks. See README.md.',
      '',
    ].join('\n')
  )
}
