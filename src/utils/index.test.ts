import { describe, expect, test } from 'vitest'

import { cn } from './index'

/**
 * `cn` is a re-export of clsx. These tests are not testing clsx -- they pin the
 * behaviour components rely on, so swapping the implementation later is a
 * visible decision rather than a silent regression.
 */
describe('cn', () => {
  test('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  test('drops falsy values instead of stringifying them', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b')
  })

  test('keeps caller classes after component classes', () => {
    expect(cn('component', 'caller')).toBe('component caller')
  })
})
