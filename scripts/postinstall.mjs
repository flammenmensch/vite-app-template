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
import { closeSync, existsSync, openSync, writeSync } from 'node:fs'
import { resolve } from 'node:path'
import { env, platform } from 'node:process'

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

/**
 * Write to the terminal rather than to stdout.
 *
 * pnpm's default reporter captures a lifecycle script's stdout and stderr,
 * renders one rolling line while it runs, then collapses the box to "Done" --
 * erasing everything the script printed. The controlling terminal is a separate
 * channel the reporter never touches, so a message sent there survives. Falls
 * back to stdout when no terminal is attached, which is also when pnpm switches
 * to a reporter that prints captured output anyway.
 */
const printToTerminal = (text) => {
  // Selected by platform, never probed: `openSync` with 'w' creates a missing
  // file, so trying the wrong device would quietly write a file of that name.
  const device = platform === 'win32' ? '\\\\.\\CONOUT$' : '/dev/tty'
  try {
    const fd = openSync(device, 'w')
    try {
      writeSync(fd, `${text}\n`)
    } finally {
      closeSync(fd)
    }
  } catch {
    // No terminal attached (piped, or CI): pnpm shows captured output there.
    console.log(text)
  }
}

if (isFreshScaffold && !env.CI && !isTemplateItself()) {
  printToTerminal(
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
