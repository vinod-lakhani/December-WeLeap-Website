import { describe, expect, it } from 'vitest'

import { MESSAGES, withFormDirection, waitPhrase} from './OfferLetterUpload'

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

describe('waitPhrase', () => {
  /**
   * The route has always sent Retry-After and the client always ignored it, so
   * a visitor with two minutes left was told to come back in an hour. That is
   * not a rounding problem — it is telling somebody the feature is unavailable
   * when it is about to work.
   */
  it('reads back the real wait rather than a flat hour', () => {
    expect(waitPhrase(120)).toBe('about 2 minutes')
    expect(waitPhrase(720)).toBe('about 12 minutes')
    expect(waitPhrase(2536)).toBe('about 43 minutes')
  })

  it('rounds up, so it never promises sooner than it is', () => {
    // 61 seconds is two minutes' worth of waiting from where the reader sits.
    expect(waitPhrase(61)).toBe('about 2 minutes')
    expect(waitPhrase(30)).toBe('a minute')
  })

  it('switches to hours once minutes stop being readable', () => {
    expect(waitPhrase(3_600)).toBe('about an hour')
    expect(waitPhrase(7_200)).toBe('about 2 hours')
  })

  it('degrades to vague rather than wrong when the header is missing', () => {
    // A missing or junk header must not render "NaN minutes".
    expect(waitPhrase(null)).toBe('a little while')
    expect(waitPhrase(Number.NaN)).toBe('a little while')
    expect(waitPhrase(0)).toBe('a little while')
    expect(waitPhrase(-5)).toBe('a little while')
  })

  it('leaves no placeholder visible if a message is rendered unfilled', () => {
    // {wait} reaching a user is worse than a vague phrase.
    for (const m of Object.values(MESSAGES)) {
      expect(m.replace('{wait}', waitPhrase(600))).not.toContain('{wait}')
    }
  })
})
