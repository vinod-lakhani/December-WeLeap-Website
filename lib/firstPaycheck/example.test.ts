import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { computeFirstPaycheck } from './calculation'
import { EXAMPLE_JOB, PAYCHECK_EXAMPLE } from './example'

/**
 * The example is the campaign's promise, rendered.
 *
 * If the creative says one number and the page computes another, the page is
 * the thing that fails — a visitor who arrives on a promise and reads a
 * different figure has been told the tool is unreliable before it has said
 * anything else. These pin the figures the ad is allowed to quote. When one
 * fails, the ad needs rewriting; the fix is not to adjust the expectation.
 */
describe('the first-paycheck campaign example', () => {
  it('is the same salary the offer campaign quotes', () => {
    // Two ads for the same product, six weeks apart in the same person's life.
    // Different salaries across them reads as carelessness.
    expect(PAYCHECK_EXAMPLE.salary).toBe(62_000)
  })

  it('lands where the creative says it lands', () => {
    expect(Math.round(PAYCHECK_EXAMPLE.gross)).toBe(2_583)
    expect(Math.round(PAYCHECK_EXAMPLE.takeHome)).toBe(2_003)
  })

  it('leads with a gap worth stopping for', () => {
    // The whole reason this tool is a campaign destination: the number in the
    // offer letter and the number that lands are far enough apart to be news.
    const shrinkage = 1 - PAYCHECK_EXAMPLE.takeHome / PAYCHECK_EXAMPLE.gross
    expect(shrinkage).toBeGreaterThan(0.2)
  })

  it('names employer money the visitor can still act on', () => {
    // The card closes on this rather than on the shrinkage. A page that only
    // subtracts gives a paid visitor nothing to do.
    expect(PAYCHECK_EXAMPLE.match).toBe(2_480)
    expect(PAYCHECK_EXAMPLE.contributionPct).toBe(4)
  })

  it('is computed, not typed out', () => {
    // The guard against the example drifting away from what the calculator
    // would actually say for the same job.
    const fresh = computeFirstPaycheck(EXAMPLE_JOB)
    expect(fresh.takeHomePerCheck).toBe(PAYCHECK_EXAMPLE.takeHome)
    expect(fresh.grossPerCheck).toBe(PAYCHECK_EXAMPLE.gross)
    expect(fresh.employerMatchAnnual).toBe(PAYCHECK_EXAMPLE.match)
  })

  it('does not hand the example a state the visitor will not have', () => {
    /**
     * Picking a no-income-tax state would make the example quietly luckier
     * than the page: every visitor who then selects where they actually work
     * would watch the paycheck fall, having been shown a better one first.
     */
    expect(EXAMPLE_JOB.stateCode).toBe('')
  })

  it('reconciles: gross less withholding less the deferral is take-home', () => {
    // The hero derives the withholding row by subtraction so the ladder always
    // adds up, whichever source answered. This is that arithmetic.
    const p = computeFirstPaycheck(EXAMPLE_JOB)
    const withheld = p.grossPerCheck - p.contributionPerCheck - p.hsaPerCheck - p.takeHomePerCheck
    expect(withheld).toBeGreaterThan(0)
    expect(p.grossPerCheck - withheld - p.contributionPerCheck - p.hsaPerCheck)
      .toBeCloseTo(p.takeHomePerCheck, 6)
  })
})

/**
 * Read from source: this repo has no component-render setup, and both
 * properties below are single conditions that are cheap to lose in a refactor
 * and expensive to lose quietly.
 */
describe('campaign mode on the first-paycheck tool', () => {
  const tool = readFileSync(join(process.cwd(), 'components/FirstPaycheckTool.tsx'), 'utf8')

  it('does not report a completion for a visitor who only arrived', () => {
    /**
     * The salary is pre-filled, so the plan exists before anybody has typed.
     * Firing tool_completed off that would mark every bounce as a completion
     * and invert the one metric the campaign is judged on.
     */
    // The gate gained a threshold on 18 Oct, matching the offer tool: a plan
    // alone, or one keystroke, is no longer a completion — `plan` needs only a
    // salary, and matchRatePct defaults to '100', so the old gate reported a
    // completion claiming has_match: true for someone who typed one number.
    // The invariant this test protects is unchanged and is what is asserted:
    // the plan existing can never be the gate on its own.
    expect(tool).toMatch(/if \(plan && engagementCount > 0 && enoughInput && !completed\.current\)/)
    expect(tool).toMatch(/const enoughInput = touchedFields\.has\('salary'\)/)
  })

  it('uses the same completion gate as the offer tool, for every source', () => {
    /**
     * A gate that differs between campaign and organic traffic, or between the
     * two campaign destinations, makes the numbers uncomparable — which is the
     * entire point of running a channel test. Neither tool may wait on a tax
     * lookup, and neither may fire on a result alone.
     */
    const offer = readFileSync(join(process.cwd(), 'components/OfferAnalysisTool.tsx'), 'utf8')
    // Offer's gate gained a threshold on 18 Oct; the shared part — a result
    // plus a real field change — is what both tools must keep. The remaining
    // nine tools adopt the threshold next, per the Oct 18 spec.
    expect(offer).toMatch(/const analysisComplete =\s*\n?\s*hasResults && fieldChangeCount > 0/)
    expect(offer).not.toMatch(/analysisComplete = hasResults && !!taxResult/)
  })

  it('marks the on-load result as a campaign one, so the two can be split', () => {
    /**
     * lib/tool-instrumentation.test.ts already proves every tool emits
     * tool_result_shown. What is specific to a campaign landing is that it
     * fires on ARRIVAL — the salary is pre-filled — so the flag has to be
     * passed through or the on-load population cannot be separated from the
     * organic one that reached a result by typing.
     */
    expect(tool).toMatch(/useResultShown\('first_paycheck', !!plan, campaign\)/)
    const offer = readFileSync(join(process.cwd(), 'components/OfferAnalysisTool.tsx'), 'utf8')
    expect(offer).toMatch(/useResultShown\('offer', hasResults, campaign\)/)
  })

  it('counts a document that parsed as engagement', () => {
    /**
     * Uploading the offer letter and letting the parser fill the form is the
     * highest-intent action on either page. Scoring it as zero engagement
     * reported the people using the feature the tool was built around as
     * bounces.
     */
    expect(tool).toMatch(/if \(filled\.size > before\) markEngaged\('upload_document'\)/)
    const offer = readFileSync(join(process.cwd(), 'components/OfferAnalysisTool.tsx'), 'utf8')
    expect(offer).toMatch(/markEngaged\(kind === 'benefits' \? 'upload_benefits_guide' : 'upload_offer_letter'\)/)
  })

  it('only pre-fills the example for campaign traffic', () => {
    expect(tool).toMatch(/campaign \? PAYCHECK_EXAMPLE\.salary\.toLocaleString\('en-US'\) : ''/)
  })
})

/**
 * tool_completed must not report the form's defaults as the visitor's answers.
 *
 * Every optional control on this page is prefilled — matchRatePct '100',
 * matchCapPct '4', payFrequency 'semimonthly', hsaEligible false — and all
 * three were reported unconditionally. A completion therefore asserted an
 * employer match and a semi-monthly pay cycle for someone who had typed a
 * salary and nothing else. `has_match: true` was a statement about the
 * defaults wearing the clothes of a fact about the person.
 *
 * Nothing consumed these (0 of 136 live insights referenced any of them), so
 * the semantics could be corrected rather than worked around.
 */
describe('first-paycheck completion reports only what the visitor supplied', () => {
  const tool = () =>
    readFileSync(join(process.cwd(), 'components/FirstPaycheckTool.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

  it('gates each prefilled field on having been touched', () => {
    const src = tool()
    expect(src).toMatch(/\.\.\.\(matchSupplied \? \{ has_match:/)
    expect(src).toMatch(/\.\.\.\(touchedFields\.has\('hsa'\) \? \{ hsa_eligible:/)
    expect(src).toMatch(/\.\.\.\(touchedFields\.has\('pay_frequency'\) \? \{ pay_frequency:/)
  })

  it('never reports them unconditionally', () => {
    const src = tool()
    // The exact shape that was wrong: a bare key with no supplied-check.
    expect(src).not.toMatch(/^\s*has_match: plan\.contributionPct > 0,\s*$/m)
    expect(src).not.toMatch(/^\s*hsa_eligible: hsaEligible,\s*$/m)
    expect(src).not.toMatch(/^\s*pay_frequency: payFrequency,\s*$/m)
  })

  it('makes an absence legible rather than mysterious', () => {
    // Omitting a property without saying why leaves a reader unable to tell
    // "no match" from "never asked".
    expect(tool()).toMatch(/inputs_supplied: \[\.\.\.touchedFields\]/)
  })
})
