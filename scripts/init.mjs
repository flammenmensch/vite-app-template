#!/usr/bin/env node
/**
 * One-time setup for a project scaffolded from this template: rewrites the
 * template's identity, installs git hooks, then deletes itself.
 *
 *     pnpm run init
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { env, stdin, stdout, exit } from 'node:process'
import { createInterface } from 'node:readline/promises'

const root = resolve(import.meta.dirname, '..')
const read = (file) => readFile(resolve(root, file), 'utf8')
const write = (file, contents) => writeFile(resolve(root, file), contents)

/** npm package names: lowercase, no spaces, optionally scoped. */
const NAME = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

const run = (command, args) =>
  execFileSync(command, args, { cwd: root, stdio: 'pipe' })

/** Run a command for its output; '' when it is missing, fails, or says nothing. */
const capture = (command, args) => {
  try {
    return execFileSync(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return ''
  }
}

/** `npm config get` prints the string "undefined" for anything unset. */
const npmConfig = (key) => {
  const value = capture('npm', ['config', 'get', key])
  return value === 'undefined' || value === 'null' ? '' : value
}

/**
 * Guess the author the way `npm init` does, preferring the npm settings that
 * exist for exactly this purpose and falling back to git's identity, which far
 * more people have actually set. `EMAIL` is git's own last resort, so honour it.
 */
const defaultAuthor = () => {
  const name =
    npmConfig('init-author-name') || capture('git', ['config', 'user.name'])
  const email =
    npmConfig('init-author-email') ||
    capture('git', ['config', 'user.email']) ||
    env.EMAIL ||
    ''

  if (!name) return email
  return email ? `${name} <${email}>` : name
}

/**
 * Take the repository from git's origin, as `npm init` does. A degit scaffold
 * has no repository yet, so this is empty there and filled in on the
 * "Use this template" and `gh repo create` paths, which clone a real remote.
 */
const defaultRepository = () => {
  const origin = capture('git', ['remote', 'get-url', 'origin'])
  const ssh = origin.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?$/)

  if (ssh) return `https://${ssh[1]}/${ssh[2]}`
  return origin.replace(/\.git$/, '')
}

/** Directory names need not be valid package names: `My App` -> `my-app`. */
const toPackageName = (value) => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\-._~]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')

  return cleaned || 'app'
}

/**
 * Install husky's git hooks.
 *
 * `prepare` normally does this during `pnpm install`, but husky needs `.git` to
 * exist by then and exits 0 without it. `degit` scaffolds have no repository,
 * and nothing re-runs `prepare` afterwards -- not even a later `git init` -- so
 * hooks would stay uninstalled. This step runs after install, so it can fix the
 * order. Idempotent: repositories from "Use this template" already have hooks.
 */
const installGitHooks = () => {
  try {
    if (!existsSync(resolve(root, '.git'))) {
      run('git', ['init', '--quiet'])
      console.log('Initialised a git repository.')
    }
    run(resolve(root, 'node_modules', '.bin', 'husky'), [])
    console.log('Installed git hooks.')
  } catch (error) {
    // Never fail setup over hooks: the metadata rewrite is already written and
    // this script is about to delete itself.
    console.warn(`\nCould not install git hooks: ${error.message}`)
    console.warn('Run `git init` and then `pnpm run prepare` to finish.\n')
  }
}

/**
 * Collect piped answers before asking anything.
 *
 * `rl.question()` only claims the line that arrives after it is called, and a
 * pipe hands over its whole buffer in one chunk -- so every answer past the
 * first lands with no question pending and is dropped. The next question then
 * waits for input that can never arrive, stdin ends, and node exits 13 with
 * "Detected unsettled top-level await". Reading the pipe up front removes the
 * race, and makes `init` scriptable rather than merely non-crashing.
 */
const readPipedAnswers = async () => {
  stdin.setEncoding('utf8')
  let input = ''
  for await (const chunk of stdin) input += chunk
  const lines = input.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}

const interactive = Boolean(stdin.isTTY)
const piped = interactive ? [] : await readPipedAnswers()

// Refuse rather than assume: `init` rewrites package.json and deletes scripts/,
// which should not happen because something ran it with no input attached.
if (!interactive && piped.length === 0) {
  console.error('`init` needs a terminal, or the answers on stdin:\n')
  console.error(
    "  printf 'my-app\\nA description\\nAuthor\\n\\n' | pnpm run init\n"
  )
  exit(1)
}

const rl = interactive
  ? createInterface({ input: stdin, output: stdout })
  : undefined

/** Set while a question is outstanding, so a closed input fails loudly. */
let awaitingAnswer = false

rl?.once('close', () => {
  if (!awaitingAnswer) return
  console.error('\nCancelled: no answer given.')
  exit(1)
})

const ask = async (question, fallback) => {
  const prompt = `${question} (${fallback}) `

  if (!interactive) {
    const answer = (piped.shift() ?? '').trim() || fallback
    console.log(prompt + answer)
    return answer
  }

  awaitingAnswer = true
  const answer = (await rl.question(prompt)).trim()
  awaitingAnswer = false
  return answer || fallback
}

try {
  const name = await ask('Project name', toPackageName(basename(root)))
  if (!NAME.test(name)) {
    console.error(`\n"${name}" is not a valid npm package name.`)
    exit(1)
  }

  const description = await ask('Description', '')
  const author = await ask('Author', defaultAuthor())
  const repository = await ask('Repository URL', defaultRepository())

  const pkg = JSON.parse(await read('package.json'))

  pkg.name = name
  pkg.description = description
  pkg.version = '0.1.0'

  if (author) pkg.author = author
  else delete pkg.author

  if (repository) {
    pkg.repository = { type: 'git', url: `git+${repository}.git` }
    pkg.bugs = { url: `${repository}/issues` }
    pkg.homepage = `${repository}#readme`
  } else {
    delete pkg.repository
    delete pkg.bugs
    delete pkg.homepage
  }

  // Neither belongs to the new project. `postinstall` and `init` both point
  // into scripts/, which this script deletes -- leaving either behind would
  // break every later `pnpm install`.
  delete pkg.keywords
  delete pkg.scripts.postinstall
  delete pkg.scripts.init

  // The guarded version exists only for scaffolds without a repository. From
  // here on there is always a `.git`, and scripts/ is about to be deleted.
  pkg.scripts.prepare = 'husky'

  await write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  const html = await read('index.html')
  await write(
    'index.html',
    html.replace(
      /<title>.*<\/title>/,
      `<title>${name.replace(/^@[^/]+\//, '')}</title>`
    )
  )

  await write(
    'README.md',
    [
      `# ${name}`,
      '',
      description,
      '',
      'Scaffolded from [vite-app-template](https://github.com/flammenmensch/vite-app-template).',
      'See that repository for how the unit, browser and visual test suites fit together.',
      '',
      '## Getting started',
      '',
      '```sh',
      'pnpm install',
      'pnpm exec playwright install chromium',
      'pnpm start',
      '```',
      '',
    ].join('\n')
  )

  installGitHooks()

  await rm(resolve(root, 'scripts'), { recursive: true, force: true })

  console.log(`\nDone. "${name}" is ready.`)
  console.log(
    'Re-record visual baselines once you replace the example component:'
  )
  console.log('  pnpm test:visual:update\n')
} finally {
  rl?.close()
}
