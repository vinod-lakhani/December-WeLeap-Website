import { describe, expect, it } from 'vitest'

import { MESSAGES, withFormDirection } from './OfferLetterUpload'

/**
 * The upload block is a shortcut for a form, and every failure message points
 * at that form. Which way it points depends on the surface: the offer tool now
 * asks for the salary above the block, while the first-paycheck tool and the
 * compare panel keep their fields underneath. Sending somebody the wrong way
 * down a seventeen-screen page is worse than saying nothing.
 */
describe('withFormDirection', () => {
  it.each(Object.entries(MESSAGES))('leaves no placeholder in %s', (_key, message) => {
    for (const formAbove of [true, false]) {
      const out = withFormDirection(message, formAbove)
      expect(out).not.toMatch(/\{/)
      expect(out).not.toMatch(/\}/)
    }
  })

  it('points down by default and up when the form is above', () => {
    const msg = MESSAGES.upload_unavailable!
    expect(withFormDirection(msg, false)).toContain('The form below')
    expect(withFormDirection(msg, true)).toContain('The form above')
  })

  it('handles the lowercase form of the placeholder too', () => {
    const msg = MESSAGES.busy!
    expect(withFormDirection(msg, false)).toContain('the form below')
    expect(withFormDirection(msg, true)).toContain('the form above')
  })

  it('leaves messages that never mention the form alone', () => {
    // "That file is over 4MB" has nothing to point at.
    const msg = MESSAGES.too_large!
    expect(withFormDirection(msg, true)).toBe(msg)
    expect(withFormDirection(msg, false)).toBe(msg)
  })
})
