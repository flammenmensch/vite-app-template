#!/usr/bin/env sh
set -e

# The named volume mounted over /app/node_modules outlives image rebuilds, so a
# lockfile change on the host would otherwise leave stale dependencies inside
# it -- with no visible sign beyond a confusing failure. Reconciling on every
# start costs about a second against a warm store and removes the whole class
# of "works in CI, not in my container" problems.
pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

exec "$@"
