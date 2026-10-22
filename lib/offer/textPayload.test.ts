import { describe, expect, it } from 'vitest'

import { computeOfferValue } from './calculate'
import { compareOffers, type OfferSide } from './compare'
import { EXAMPLE_OFFER } from './example'
import { computeLevers } from './levers'
import { offerTextPayload } from './textPayload'

const tax = { netIncomeAnnual: 48_000, federalTaxAnnual: 6_000, stateTaxAnnual: 3_000, ficaTaxAnnual: 4_743 }
const side = (label: string, salary: number): OfferSide => {
  const inputs = { ...EXAMPLE_OFFER, salary }
  return { label, location: 'Austin, TX', inputs, value: computeOfferValue(inputs, tax)! }
}

describe('the offer text payload', () => {
  it('sends the three headline figures and every value, with no label for a single offer', () => {
    const a = side('Offer A', 62_000)
    const p = offerTextPayload({ id: 'x', side: a, tax, levers: computeLevers(a.inputs, tax), comparison: null, other: null })
    expect(p.salary).toBe(62_000)
    expect(p.totalPackage).toBe(a.value.totalPackage)
    expect(p.takeHomeMonthly).toBe(a.value.takeHomeMonthly)
    expect(p.label).toBe('')
    expect(p.comparison).toBeNull()
    expect(p.federalTaxAnnual).toBe(6_000)
    expect((p.figures as Record<string, unknown>).inputs).toEqual(a.inputs)
  })

  it('sends the other offer and the calculator verdict when comparing', () => {
    const a = side('Offer A', 62_000)
    const b = side('Offer B', 75_000)
    const comparison = compareOffers(a, b)
    const p = offerTextPayload({ id: 'x', side: a, tax, levers: [], comparison, other: b })
    const c = p.comparison as Record<string, unknown>
    expect(p.label).toBe('Offer A')
    expect(c.otherSalary).toBe(75_000)
    expect(c.otherTotalComp).toBe(b.value.totalPackage)
    expect(c.otherLocation).toBe('Austin, TX')
    expect(c.verdict).toEqual(comparison.verdict)
  })
})
