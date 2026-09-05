# Security

This is a project template. It is not a deployed service, and it holds no
credentials — but it does run code on the machine of everyone who scaffolds from
it, so that surface is treated as the thing worth protecting.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: **Security → Report a
vulnerability** on this repository. That opens a private thread; please do not
open a public issue for something exploitable.

This is a personal project, so there is no response-time commitment. Reports are
read and acted on as time allows.

## What is in scope

Anything that could let this template harm a machine that uses it:

- code executed automatically — `postinstall`, `prepare`, git hooks, `init`
- a way to get a shell, a path traversal, or an unvalidated value into a command
- workflow configuration that could leak a token or run untrusted code in CI
- the visual container's privileges over the host
- a dependency pinned here at a version with a known advisory

## What is not

- advisories in dependencies themselves — report those upstream. Do open an
  issue here if this repo pins an affected version, so the pin can move.
- findings that require an attacker to already control the developer's machine

## Posture

Documented in [README.md](README.md#what-runs-on-your-machine):

- `minimumReleaseAge: 1440` — no dependency version younger than 24 hours will
  install, and there is deliberately no exclusion list
- `allowBuilds` names the only packages permitted to run install scripts, and
  holds exactly the three that need one
- every command this repo spawns goes through `execFileSync` with an argument
  array; nothing reaches a shell
- workflow actions are pinned to commit SHAs, run with `contents: read`, and
  pass `persist-credentials: false` so no job token is left in `.git/config`
- `packageManager` carries a corepack integrity hash, so the package manager
  binary itself is verified on first download
- the visual container masks the host's `.git` and `.husky`, so nothing running
  inside it can plant a hook that later executes on the host
