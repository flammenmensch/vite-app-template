# syntax=docker/dockerfile:1

# Pinned to the exact Node in .nvmrc, so the container and the host agree and
# `engines.node` is satisfied inside as well as out.
#
# Deliberately NOT mcr.microsoft.com/playwright: that image pins its own Node
# (22.x at time of writing), which would drift from .nvmrc. Starting from Node
# and adding browsers keeps the Playwright version coming from pnpm-lock.yaml
# rather than being declared a second time in an image tag.
#
# Debian 12 rather than Ubuntu: the official Node images ship Debian and Alpine
# only -- there is no Ubuntu variant to match Playwright's own `noble` images.
# Debian 12 is a Playwright-supported platform, and since CI runs this exact
# container, matching upstream's base is not required. What matters is that
# every run uses the same one.
FROM node:26.8.1-bookworm

# `npm_config_store_dir` is how pnpm picks up npm-style config from the
# environment. Setting it here rather than running `pnpm config set --global`
# saves a layer and, more to the point, avoids that command's dependency on
# PNPM_HOME/bin being on PATH. The path must match the named volume in
# compose.yaml, or that volume would cache an empty directory.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true \
    npm_config_store_dir=/pnpm/store \
    UV_USE_IO_URING=0

RUN corepack enable

WORKDIR /app

# Dependency layer, cached independently of source. Copying the manifests alone
# means editing a component does not invalidate node_modules.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `--ignore-scripts`: the only lifecycle script here is husky's `prepare`, which
# needs a .git directory the image deliberately does not carry. Skipping it also
# keeps arbitrary install-time code out of the image build.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Browsers plus their system libraries. `--with-deps` resolves the apt packages
# Playwright needs for this distro, so the font and rendering stack is pinned by
# the image rather than by whatever the host happens to have.
RUN pnpm exec playwright install --with-deps chromium

COPY docker/visual-entrypoint.sh /usr/local/bin/visual-entrypoint
RUN chmod +x /usr/local/bin/visual-entrypoint

ENTRYPOINT ["visual-entrypoint"]
CMD ["pnpm", "exec", "vitest", "run", "--project=visual"]
