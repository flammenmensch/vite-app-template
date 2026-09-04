import babel from '@rolldown/plugin-babel'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'

import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
