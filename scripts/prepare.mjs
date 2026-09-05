#!/usr/bin/env node
/**
 * Install husky's git hooks, but only once a repository exists.
 *
 * Running `husky` directly prints ".git can't be found" during the very first
 * `pnpm install` of a degit scaffold, which reads like a broken template -- the
 * directory has no repository yet by construction. Staying quiet until there is
 * one keeps that install clean, and leaves `pnpm run prepare` to install the
 * hooks once `git init` has run. A second `pnpm install` will not do it: pnpm
 * skips lifecycle scripts entirely when the install is already up to date.
 *
 * `init` rewrites this script back to plain `husky` when it deletes scripts/,
 * so a finished project keeps installing hooks for whoever clones it.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { platform } from 'node:process'

const root = resolve(import.meta.dirname, '..')

// A worktree or submodule has `.git` as a file rather than a directory.
if (!existsSync(resolve(root, '.git'))) process.exit(0)

const husky = resolve(
  root,
  'node_modules',
  '.bin',
  platform === 'win32' ? 'husky.cmd' : 'husky'
)

if (existsSync(husky)) {
  execFileSync(husky, [], { cwd: root, stdio: 'inherit' })
}
