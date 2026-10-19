import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { RENT_EXAMPLE } from '@/lib/rentCampaign/example'

/**
 * The rent tool's campaign path used to report a completed tool for one
 * keystroke.
 *
 * `?campaign=1` prefills salary and city from RENT_EXAMPLE so the first screen
 * can be an answer rather than a form — which is the point of the hero, and
 * which also meant `heroResultShown` was true at mount. The gate was "a result
 * is on screen and the visitor did something", so a focus on the start date
 * completed the tool, carrying a rent range computed from the ad's $70,000.
 * Measured on 19 Oct 2025: one keystroke, `fields_changed: 1`, no submission.
 *
 * This is the fourth time the same shape has appeared — the 100% default on
 * the offer tool, `'100'`/`'4'` on first-paycheck, DEFAULTS on first-loan. A
 * non-empty default makes a value-based gate vacuous. These tests read source,
 * which is weaker than driving the page, so they pin only the two things that
 * would silently restore the defect.
 */

const src = readFileSync(join(process.cwd(), 'components/RentTool.tsx'), 'utf8')
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('rent completion threshold', () => {
  it('needs a changed input, not just a rendered result', () => {
    // `hasResult` alone is reachable at mount on the campaign path.
    expect(code).toMatch(/const heroInputSupplied =[\s\S]{0,200}changedFields\.has\('salary'\)/)
    expect(code).toMatch(/const heroInputSupplied =[\s\S]{0,200}changedFields\.has\('city'\)/)

    const gate = code.slice(code.indexOf('if (\n      hasResult'), code.indexOf("track('tool_completed'"))
    expect(
      gate.includes('heroInputSupplied'),
      'the tool_completed gate no longer consults heroInputSupplied, so the ' +
        'prefilled campaign hero can complete without the visitor typing anything'
    ).toBe(true)
  })

  it('does not count focus as a changed input', () => {
    // Focus is engagement — it is what fires tool_engaged — but tabbing
    // through a prefilled form is not supplying a number. If these ever pass
    // `true`, the threshold above is vacuous again and nothing else fails.
    for (const match of code.matchAll(/onFocus=\{\(\) => handleFormStart\([^}]*\}/g)) {
      expect(
        match[0].includes('true'),
        `${match[0]} marks a field changed on focus. Only change handlers may.`
      ).toBe(false)
    }
    expect([...code.matchAll(/onFocus=\{\(\) => handleFormStart\(/g)].length).toBeGreaterThan(0)
  })

  it('sets the salary floor below the example the ad prefills', () => {
    // The floor stops the completion landing mid-word, on "9" of "95000".
    // Above RENT_EXAMPLE.salary it would also block the visitor who accepts
    // the ad's salary and only corrects the city — a real completion.
    const floor = Number(/const MIN_PLAUSIBLE_SALARY = (\d+)/.exec(code)?.[1])
    expect(Number.isFinite(floor)).toBe(true)
    expect(floor).toBeLessThanOrEqual(RENT_EXAMPLE.salary)
    expect(floor).toBeGreaterThan(9999)
  })
})
