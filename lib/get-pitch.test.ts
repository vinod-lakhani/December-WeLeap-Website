import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ALL_PITCHES, DEFAULT_PITCH, MAX_HEADLINE, pitchFor } from './get-pitch'

/**
 * The two failures worth catching here are both silent.
 *
 * A proof image with a wrong path renders as a broken box on the one page paid
 * traffic lands on, and nothing in a type check or a build would say so. And a
 * headline that grows by one line pushes the store button under the fold of an
 * in-app browser, which costs taps without ever looking like a bug.
 */

describe('matching the pitch to the ad', () => {
  it('falls back to the default for traffic it does not recognise', () => {
    // The live lookalike ads: no keyword in either slug, by design.
    expect(pitchFor({ utm_content: 'l3', utm_campaign: 'lal1' })).toBe(DEFAULT_PITCH)
    expect(pitchFor({ utm_content: 'app', utm_campaign: 'organic_bio' })).toBe(DEFAULT_PITCH)
  })

  it('falls back for a visit with no tags at all', () => {
    expect(pitchFor({})).toBe(DEFAULT_PITCH)
    expect(pitchFor(undefined)).toBe(DEFAULT_PITCH)
    expect(pitchFor({ utm_content: '   ' })).toBe(DEFAULT_PITCH)
  })

  it('reads the creative slug', () => {
    expect(pitchFor({ utm_content: 'debt_payoff_v2' }).proof.src).toContain('debt-payoff')
    expect(pitchFor({ utm_content: 'emergency_fund_01' }).proof.src).toContain('savings-path')
    expect(pitchFor({ utm_content: '401k_match_hook' }).proof.src).toContain('weekly-focus')
  })

  it('reads the campaign slug too, since naming differs per campaign', () => {
    expect(pitchFor({ utm_campaign: 'cc_payoff_oct' }).proof.src).toContain('debt-payoff')
  })

  it('ignores case', () => {
    expect(pitchFor({ utm_content: 'DEBT_Payoff' }).proof.src).toContain('debt-payoff')
  })

  it('prefers the more specific promise when a slug names two themes', () => {
    // A debt ad that also says "saving" is still a debt ad.
    expect(pitchFor({ utm_content: 'debt_saving_combo' }).proof.src).toContain('debt-payoff')
  })
})

describe('every pitch is shippable', () => {
  it('points at an image that exists', () => {
    for (const pitch of ALL_PITCHES) {
      const file = join(process.cwd(), 'public', pitch.proof.src)
      expect(existsSync(file), `missing proof image: ${pitch.proof.src}`).toBe(true)
    }
  })

  it('keeps the headline short enough to leave the button above the fold', () => {
    for (const pitch of ALL_PITCHES) {
      expect(pitch.headline.length, `too long: ${pitch.headline}`).toBeLessThanOrEqual(MAX_HEADLINE)
    }
  })

  it('describes the screen for anyone who cannot see it', () => {
    for (const pitch of ALL_PITCHES) {
      // The alt text is the proof for a screen reader, so it has to carry the
      // same specifics the image does rather than naming the file.
      expect(pitch.proof.alt.length).toBeGreaterThan(40)
      expect(pitch.proof.alt).toMatch(/\$|%/)
    }
  })
})

describe('the page actually uses it', () => {
  it('renders the pitch and names the store on the button', () => {
    const src = readFileSync(join(process.cwd(), 'components/GetRedirect.tsx'), 'utf8')
    // Strip comments: the prose here explains the change and would otherwise
    // satisfy a test of the code it describes.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(code).toContain('pitchFor(utm)')
    expect(code).toContain('{pitch.headline}')
    expect(code).toContain('{pitch.sub}')
    expect(code).toContain('pitch.proof.src')
    expect(code).toMatch(/Download on the App Store/)
    // The anchor must stay a real href — the in-app-browser handoff depends on
    // it, and no amount of copy work is worth breaking that.
    expect(code).toMatch(/<a\s+href=\{storeHref\}/)
  })
})
