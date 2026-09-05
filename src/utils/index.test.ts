import { describe, expect, test } from 'vitest'

import { cn } from './index'

// Pins the behaviour components rely on, so replacing clsx is a visible choice.
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
