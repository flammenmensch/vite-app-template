import { style } from '@vanilla-extract/css'

import { globalTheme } from '../../styles/global.css'

/**
 * Reads from the theme rather than hardcoding a value. The previous
 * `fontFamily: 'SF Pro'` both bypassed the design system and named a macOS
 * system font, so it could never resolve anywhere else -- including the Linux
 * container that records the visual baselines.
 */
export const root = style({
  fontSize: globalTheme.fontSize.xxl,
})
