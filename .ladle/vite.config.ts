import babel from '@rolldown/plugin-babel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { reactCompilerPreset } from '@vitejs/plugin-react'

import { defineConfig } from 'vite'

/**
 * Ladle supplies its own React plugin, so this must not add a second one -- but
 * it needs the rest of the app's chain, or stories render what the app never
 * ships. They are the source for visual baselines.
 */
export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
