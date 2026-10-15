import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The banner covered the primary action on every paid landing: 335px tall on a
 * 560px in-app-browser viewport, sitting on top of /get's store button and on
 * top of the result a campaign tool page renders.
 *
 * Height is a rendered property and these tests are not, so they cannot assert
 * it — that was measured in the browser and is recorded in the PR. What they
 * can do is pin the two things that would quietly bring the height back: the
 * prose growing again, and the buttons returning to a stacked full-width pair,
 * which cost ~90px on their own.
 *
 * They also pin the consent behaviour, because the fix had to change the
 * footprint without changing what is stored or what the choices mean.
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

describe('consent behaviour is unchanged', () => {
  it('keeps the same storage key and both choices', () => {
    const code = src()
    expect(code).toContain('localStorage.getItem("cookie-consent")')
    expect(code).toContain('localStorage.setItem("cookie-consent", "accepted")')
    expect(code).toContain('localStorage.setItem("cookie-consent", "declined")')
  })

  it('still notifies the analytics listener on accept', () => {
    // GoogleAnalytics listens for this; dropping it would silently leave
    // analytics off for everyone who accepts.
    expect(src()).toContain('new Event("cookie-consent-updated")')
  })

  it('still links the privacy policy', () => {
    expect(src()).toMatch(/href="\/privacy-policy"/)
  })

  it('renders nothing once a choice exists', () => {
    expect(src()).toContain('if (!showBanner) return null')
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
    expect(copy().toLowerCase()).toMatch(/traffic|content|analyse|analyze/)
  })

  it('keeps the two buttons on one row instead of stacking them', () => {
    const code = src()
    // The buttons' own container must not go vertical on small screens.
    expect(code).toMatch(/<div className="flex shrink-0 gap-2">/)
    expect(code).not.toMatch(/flex flex-col[^"]*gap-3 w-full sm:w-auto/)
  })

  it('does not reintroduce full-width stacked buttons', () => {
    expect(src()).not.toMatch(/className="w-full sm:w-auto/)
  })
})
