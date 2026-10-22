/**
 * The offer calculator's own figures, shaped for the text service (WeLeap backend, offer thread).
 *
 * This is the one place the offer tool's numbers become the payload Ribbit answers from. The field
 * names match the backend's OfferResult; the values are the calculator's, copied as they are. It
 * exists as its own file so the mapping can be read and tested apart from the 2,000-line tool.
 */
import type { OfferInputs, OfferValue, TaxResult } from './calculate'
import type { Comparison } from './compare'
import { leftAfterRent } from './compare'
import type { Lever } from './levers'

export interface OfferTextArgs {
  /** Stable id for this run: the calculator result's key on the backend. */
  id: string
  /** "Offer A" when comparing, otherwise empty. */
  label: string
  /** "Austin, TX", or empty until a city is chosen. */
  location: string
  inputs: OfferInputs
  /** The tax the value was worked out from, city tax included. Null while the tax call is in flight. */
  tax: TaxResult | null
  value: OfferValue
  levers: Lever[]
  /** The comparison and the other offer, when two offers are on screen. */
  comparison: Comparison | null
  other: { label: string; location: string; inputs: OfferInputs; value: OfferValue } | null
}

export function offerTextPayload(args: OfferTextArgs): Record<string, unknown> {
  const { id, label, location, inputs, value, levers, comparison, other, tax } = args
  return {
    id,
    label,
    location,
    salary: inputs.salary,
    bonusPct: inputs.bonusPct,
    matchRatePct: inputs.matchRatePct,
    matchUpToPct: inputs.matchUpToPct,
    signingBonus: inputs.signingBonus,
    ptoDays: inputs.ptoDays,
    savingsPct: inputs.savingsPct,
    rsuAnnual: inputs.rsuAnnual,
    hsaMonthly: inputs.hsaMonthly,
    healthcarePremiumMonthly: inputs.healthcarePremium,
    esppContrib: inputs.esppContrib,
    esppDiscount: inputs.esppDiscount,
    federalTaxAnnual: tax?.federalTaxAnnual ?? 0,
    stateTaxAnnual: tax?.stateTaxAnnual ?? 0,
    ficaTaxAnnual: tax?.ficaTaxAnnual ?? 0,
    netIncomeAnnual: tax?.netIncomeAnnual ?? 0,
    takeHomeMonthly: value.takeHomeMonthly,
    effectiveTaxRate: value.effectiveTaxRate,
    annualBonus: value.annualBonus,
    annual401kMatch: value.annual401kMatch,
    annualHsa: value.annualHsa,
    annualHealthcare: value.annualHealthcare,
    annualEspp: value.annualEspp,
    annualBonusAfterTax: value.annualBonusAfterTax,
    annualRsuAfterTax: value.annualRsuAfterTax,
    annualEsppAfterTax: value.annualEsppAfterTax,
    ptoValue: value.ptoValue,
    totalPackage: value.totalPackage,
    firstYearTotal: value.firstYearTotal,
    signingBonusAfterTax: value.signingBonusAfterTax,
    monthlyWealth: value.monthlyWealth,
    nw40yr: value.nw40yr,
    rentMonthly: inputs.rentMonthly,
    rentPct: value.rentPct ?? 0,
    leftAfterRent: leftAfterRent(value, inputs),
    levers: levers.map(l => ({ ask: l.ask, amount: l.amount, cadence: l.cadence, detail: l.detail })),
    comparison:
      comparison && other
        ? {
            otherLabel: other.label,
            otherTotalComp: other.value.totalPackage,
            otherSalary: other.inputs.salary,
            otherTakeHome: other.value.takeHomeMonthly,
            otherLocation: other.location,
            otherRentMonthly: other.inputs.rentMonthly,
            otherBonusPct: other.inputs.bonusPct,
            otherMatchRatePct: other.inputs.matchRatePct,
            otherMatchUpToPct: other.inputs.matchUpToPct,
            packages: comparison.packageRows,
            monthly: comparison.monthlyRows,
            totals: comparison.totals,
            firstYear: comparison.firstYear,
            firstYearApplies: comparison.firstYear.applies,
            leftAfterRent: comparison.leftAfterRent,
            verdict: comparison.verdict,
          }
        : null,
  }
}
