#!/usr/bin/env node
/**
 * One-time setup for a project scaffolded from this template.
 *
 * A template repository copies files verbatim, so a fresh app starts out
 * claiming to be `@flammenmensch/vite-app-template`, authored by someone else,
 * pointing its bug reports at a repository the new owner cannot write to. This
 * rewrites that identity, replaces the README with one about the new project,
 * and then deletes itself so it cannot be run twice.
 *
 * It also installs the git hooks, which cannot happen during `pnpm install`
 * when the project was scaffolded with `degit` -- see `installGitHooks` below.
 *
 *     pnpm run init
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { stdin, stdout, exit } from 'node:process'
import { createInterface } from 'node:readline/promises'

const root = resolve(import.meta.dirname, '..')
const read = (file) => readFile(resolve(root, file), 'utf8')
const write = (file, contents) => writeFile(resolve(root, file), contents)

/** npm package names: lowercase, no spaces, optionally scoped. */
const NAME = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

const run = (command, args) =>
  execFileSync(command, args, { cwd: root, stdio: 'pipe' })

/**
 * Install husky's git hooks.
 *
 * The `prepare` script normally does this during `pnpm install`, but husky
 * needs a `.git` directory to exist at that moment and exits 0 without one --
 * it has to, since it is also installed transitively, in CI, and in this
 * project's Docker image, none of which are git repositories.
 *
 * `degit` copies files without any git history, so the order ends up backwards:
 * install runs first, finds no repository, and quietly does nothing. Nothing
 * re-runs `prepare` afterwards, not even `git init`, so the hooks would stay
 * uninstalled permanently and lint-staged and commitlint would never fire.
 *
 * Running here closes that gap, because this is the one step that happens after
 * install. It is idempotent: projects created with GitHub's "Use this template"
 * already have a repository and working hooks, and re-running husky is a no-op.
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
    // Never fail the whole setup over hooks -- the metadata rewrite above has
    // already been written, and a second run is impossible once this script
    // deletes itself.
    console.warn(`\nCould not install git hooks: ${error.message}`)
    console.warn('Run `git init` and then `pnpm run prepare` to finish.\n')
  }
}

const rl = createInterface({ input: stdin, output: stdout })

const ask = async (question, fallback) => {
  const answer = (await rl.question(`${question} (${fallback}) `)).trim()
  return answer || fallback
}

try {
  const name = await ask('Project name', basename(root))
  if (!NAME.test(name)) {
    // Failing here is friendlier than writing a package.json that every
    // subsequent pnpm command rejects.
    console.error(`\n"${name}" is not a valid npm package name.`)
    exit(1)
  }

  const description = await ask('Description', '')
  const author = await ask('Author', '')
  const repository = await ask('Repository URL', '')

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

  // The template ships its own keywords and its init script; neither belongs
  // to the new project.
  delete pkg.keywords
  delete pkg.scripts.init

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
  console.log('Visual baselines still belong to the template — re-record them:')
  console.log('  pnpm test:visual:update\n')
} finally {
  rl.close()
}
