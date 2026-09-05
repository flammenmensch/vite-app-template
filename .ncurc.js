import { readFileSync } from 'node:fs'

/**
 * Config for `ncu` (npm-check-updates).
 *
 * `cooldown` is derived from pnpm's `minimumReleaseAge` rather than repeated,
 * so the two cannot drift. If ncu offered a version younger than pnpm's cutoff,
 * it would suggest upgrades that `pnpm install` then refuses to resolve.
 */
const workspace = readFileSync(
  new URL('./pnpm-workspace.yaml', import.meta.url),
  'utf8'
)
const minimumReleaseAge = workspace.match(/^minimumReleaseAge:\s*(\d+)/m)

if (!minimumReleaseAge) {
  throw new Error(
    'minimumReleaseAge not found in pnpm-workspace.yaml; ncu and pnpm would disagree on which versions are installable.'
  )
}

export default {
  // pnpm counts minutes; ncu takes a unit suffix.
  cooldown: `${minimumReleaseAge[1]}m`,
}
