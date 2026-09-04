import babel from '@rolldown/plugin-babel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { reactCompilerPreset } from '@vitejs/plugin-react'

import { defineConfig } from 'vite'

/**
 * Ladle runs its own Vite and supplies its own React plugin, so this config
 * must not add a second one -- but everything else the app build applies still
 * has to be here, or the workbench would render components the app never ships.
 *
 * vanilla-extract compiles `.css.ts`. React Compiler matches `vite.config.ts`
 * and `vitest.config.ts`: stories are the source for visual baselines, so a
 * story rendering uncompiled while the app renders compiled would mean
 * screenshotting something that does not exist in production.
 */
export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
