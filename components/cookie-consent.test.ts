import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The banner is a notice, not a consent prompt: nothing downstream ever read
 * its answer, so offering Accept/Decline presented a choice the site did not
 * honour. These tests pin that it stays a notice, that it stays small enough
 * to clear the CTA it used to cover, and — the one that matters most — that
 * the privacy policy keeps naming the ad platforms that actually run.
 *
 * That last one is here because the policy asserted "we do not use advertising
 * or retargeting pixels" while the Meta Pixel was live on every marketing
 * page. A claim about what the site does not do is exactly the kind that goes
 * stale silently.
 */

const src = () => readFileSync(join(process.cwd(), 'components/cookie-consent.tsx'), 'utf8')

/** The prose only — comments explain the change and would skew any length check. */
const copy = () => {
  const code = src()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
  const paragraph = code.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  return (paragraph?.[1] ?? '').replace(/<[^>]+>/g, ' ').replace(/\{"\s*"\}/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('it is a notice, not a consent prompt', () => {
  it('offers one acknowledgement and no decline', () => {
    // Comments stripped first: the docblock explains what was removed and
    // names both old buttons, so a raw search would match the explanation.
    const code = src().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code).toContain('Got it')
    expect(code).not.toMatch(/Decline/)
    expect(code).not.toMatch(/Accept All/)
  })

  it('states what runs and links the policy that lists it', () => {
    expect(copy().toLowerCase()).toContain('analytics')
    expect(copy().toLowerCase()).toMatch(/ads|advertis/)
    expect(src()).toMatch(/href="\/privacy-policy"/)
  })

  it('remembers the acknowledgement so it shows once', () => {
    const code = src()
    expect(code).toContain('localStorage.setItem("cookie-consent", "accepted")')
    expect(code).toContain('localStorage.getItem("cookie-consent")')
    expect(code).toContain('if (!showBanner) return null')
  })

  it('does not reload the page on acknowledge', () => {
    // The reload existed to re-init GA after consent. GA is no longer gated,
    // so a reload would be a jarring side effect of dismissing a notice.
    expect(src()).not.toMatch(/window\.location\.reload/)
  })
})

describe('it stays small enough to clear the CTA', () => {
  it('keeps the copy to roughly two lines on a phone', () => {
    // ~45 characters per line at 13px on a 358px column; two lines is the
    // budget. The old copy was 232 characters — five lines — and that alone
    // was most of the height that covered the store button.
    expect(copy().length).toBeLessThanOrEqual(120)
  })

  it('states the purpose and does not just name the product', () => {
    expect(copy().toLowerCase()).toMatch(/cookies/)
    expect(copy().toLowerCase()).toMatch(/analytics|analyse|analyze|ads|advertis/)
  })

  it('keeps the action to a single row beside the text', () => {
    const code = src()
    // One button now, and its container must not go vertical on small screens:
    // a stacked full-width pair is what cost ~90px of the old banner's height.
    expect(code).toMatch(/<div className="flex shrink-0">/)
    expect(code).not.toMatch(/flex flex-col[^"]*gap-3 w-full sm:w-auto/)
  })

  it('does not reintroduce full-width stacked buttons', () => {
    expect(src()).not.toMatch(/className="w-full sm:w-auto/)
  })
})

describe('the privacy policy names what actually runs', () => {
  const policy = () => readFileSync(join(process.cwd(), 'app/privacy-policy/page.tsx'), 'utf8')

  it('does not deny using advertising pixels while one is live', () => {
    // components/meta-pixel.ts ships a real pixel on every marketing page.
    expect(policy()).not.toMatch(/do not use advertising or retargeting pixels/)
  })

  it('lists every third party that receives marketing-page events', () => {
    const p = policy()
    for (const vendor of ['PostHog', 'Google Analytics', 'Meta Pixel', 'Google Ads']) {
      expect(p, `privacy policy does not mention ${vendor}`).toContain(vendor)
    }
  })
})
