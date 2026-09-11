/**
 * Two offers, side by side.
 *
 * The page has been telling people to do this by hand: "The calculator takes
 * one offer at a time. Run it twice — once per offer, with each one's own state
 * and city — and write down four numbers each time." This is those four
 * numbers, computed.
 *
 * The whole point is the third one. A bigger package can be the one that leaves
 * you less every month, because the same salary buys very different amounts in
 * different cities, and no base-salary comparison shows it. Everything here
 * exists to put those two facts next to each other rather than to pick a
 * winner — the tool does not know about the commute, the team, or whether the
 * private-company equity is worth anything.
 */

import type { OfferInputs, OfferValue } from './calculate'

/** One side of the comparison, already priced. */
export interface OfferSide {
  /** "Offer A" / "Offer B" — the column heading. */
  label: string
  /** "Austin, TX", or empty until a city is chosen. */
  location: string
  inputs: OfferInputs
  value: OfferValue
}

export interface ComparisonRow {
  label: string
  a: number
  b: number
  /** A negative figure that reads as a cost, like the healthcare premium. */
  negative?: boolean
}

export type Winner = 'a' | 'b' | 'tie'

export interface Comparison {
  /** Annual figures — the package. */
  packageRows: ComparisonRow[]
  /** Monthly figures — living on it. */
  monthlyRows: ComparisonRow[]
  totals: { a: number; b: number; winner: Winner; delta: number }
  /**
   * Year one, where the signing bonuses land. Deliberately separate from
   * `totals`, which is what each offer pays every year — a one-off belongs in
   * neither the per-year total nor nowhere at all. `applies` is false when
   * neither offer has one, in which case there is nothing to show.
   */
  firstYear: { a: number; b: number; winner: Winner; delta: number; applies: boolean }
  leftAfterRent: { a: number; b: number; winner: Winner; delta: number }
  /**
   * Null until both offers have a rent figure. Without it the comparison is a
   * salary comparison, which is the one thing this feature exists not to be —
   * so the caller shows a prompt for the missing city rather than a verdict
   * built on half the evidence.
   */
  verdict: Verdict | null
}

export interface Verdict {
  /** True when the bigger package is not the one that leaves more each month. */
  split: boolean
  /** "Offer B is worth about $20,000 more a year on paper." */
  paper: string
  /** "Offer A leaves about $1,400 more a month after rent." */
  monthly: string
}

/**
 * Below this the two offers are the same offer, and saying "$40 more a year"
 * with a straight face would be worse than saying nothing.
 */
const ANNUAL_NOISE = 500
const MONTHLY_NOISE = 25

const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

function pick(a: number, b: number, noise: number): Winner {
  if (Math.abs(b - a) < noise) return 'tie'
  return b > a ? 'b' : 'a'
}

/** Take-home minus rent: what the offer actually leaves you each month. */
export function leftAfterRent(value: OfferValue, inputs: OfferInputs): number {
  return value.takeHomeMonthly - inputs.rentMonthly
}

export function compareOffers(a: OfferSide, b: OfferSide): Comparison {
  const packageRows: ComparisonRow[] = [
    { label: 'Base salary', a: a.inputs.salary, b: b.inputs.salary },
    { label: 'Bonus at target', a: a.value.annualBonus, b: b.value.annualBonus },
    {
      label: '401(k) match you would capture',
      a: a.value.annual401kMatch,
      b: b.value.annual401kMatch,
    },
    { label: 'Employer HSA contribution', a: a.value.annualHsa, b: b.value.annualHsa },
    {
      label: 'Healthcare premium',
      a: a.value.annualHealthcare,
      b: b.value.annualHealthcare,
      negative: true,
    },
    { label: 'ESPP discount', a: a.value.annualEspp, b: b.value.annualEspp },
    {
      label: 'Paid time off above market, valued at salary',
      a: a.value.ptoValue,
      b: b.value.ptoValue,
    },
    {
      // Counted, and on its own line so an offer that is mostly paper is
      // legible as one rather than hidden inside a single large number.
      label: 'Equity, annual vesting value',
      a: a.inputs.rsuAnnual,
      b: b.inputs.rsuAnnual,
    },
  ]

  const monthlyRows: ComparisonRow[] = [
    { label: 'Take-home after tax in that state', a: a.value.takeHomeMonthly, b: b.value.takeHomeMonthly },
    { label: 'Rent, one bedroom', a: a.inputs.rentMonthly, b: b.inputs.rentMonthly, negative: true },
  ]

  const totalA = a.value.totalPackage
  const totalB = b.value.totalPackage
  const leftA = leftAfterRent(a.value, a.inputs)
  const leftB = leftAfterRent(b.value, b.inputs)

  const totals = {
    a: totalA,
    b: totalB,
    winner: pick(totalA, totalB, ANNUAL_NOISE),
    delta: totalB - totalA,
  }
  const left = {
    a: leftA,
    b: leftB,
    winner: pick(leftA, leftB, MONTHLY_NOISE),
    delta: leftB - leftA,
  }

  const bothHaveRent = a.inputs.rentMonthly > 0 && b.inputs.rentMonthly > 0

  const firstYear = {
    a: a.value.firstYearTotal,
    b: b.value.firstYearTotal,
    winner: pick(a.value.firstYearTotal, b.value.firstYearTotal, ANNUAL_NOISE),
    delta: b.value.firstYearTotal - a.value.firstYearTotal,
    applies: a.inputs.signingBonus > 0 || b.inputs.signingBonus > 0,
  }

  return {
    packageRows,
    monthlyRows,
    totals,
    firstYear,
    leftAfterRent: left,
    verdict: bothHaveRent ? buildVerdict(a, b, totals, left) : null,
  }
}

function buildVerdict(
  a: OfferSide,
  b: OfferSide,
  totals: Comparison['totals'],
  left: Comparison['leftAfterRent'],
): Verdict {
  const nameOf = (w: Exclude<Winner, 'tie'>) => (w === 'a' ? a.label : b.label)

  const paper =
    totals.winner === 'tie'
      ? 'The two packages are worth about the same on paper.'
      : `${nameOf(totals.winner)} is worth about ${money(totals.delta)} more a year on paper.`

  const monthly =
    left.winner === 'tie'
      ? 'They leave about the same each month once rent is paid.'
      : `${nameOf(left.winner)} leaves about ${money(left.delta)} more a month after rent.`

  return {
    // The case worth flagging: the bigger package is not the one you live
    // better on. A tie on either side is not a split — nothing is in tension.
    split:
      totals.winner !== 'tie' && left.winner !== 'tie' && totals.winner !== left.winner,
    paper,
    monthly,
  }
}
