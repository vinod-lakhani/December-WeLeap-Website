/**
 * The move in the creative, worked out.
 *
 * The ad runs: "$70,000 in New York. The listing site says you can afford
 * $1,750/mo. On take-home it's $1,300 to $1,600. And you need about $4,000
 * before you get keys."
 *
 * Every figure is produced by the same functions that answer a real move —
 * calculateRentRange and calculateUpfrontCash — so the example cannot drift
 * away from what the calculator says. If a test in example.test.ts fails, the
 * AD needs rewriting, not the expectation.
 *
 * New York on purpose. The argument this page makes is that the listing sites'
 * 30%-of-gross rule allows more rent than take-home can carry, and the size of
 * that gap is mostly state income tax. New York is where it is widest among
 * the six presets: $150 a month clear at the TOP of the band, against $50 in
 * Austin, where Texas charges no income tax at all and take-home is 83% of
 * gross. The claim holds everywhere and it is worth making where it is
 * strongest — and r/nyc and r/AskNYC are where the question gets asked.
 */

import { estimateTaxAnnual } from '@/lib/allocator/takeHome'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import { localTaxAnnual } from '@/lib/localTax'
import {
  calculateRentRange,
  calculateUpfrontCash,
  listingSiteRentMonthly,
} from '@/lib/rent'

/** The move the creative describes. */
export const EXAMPLE_MOVE = {
  salary: 70_000,
  city: 'NYC',
  stateCode: 'NY',
} as const

/**
 * Take-home from the local table, which is what the page paints first.
 *
 * The hero renders immediately off this and swaps in /api/tax when it answers,
 * because a page sold on a number cannot open on a spinner. For Austin the two
 * agreed to the dollar — Texas has no state tax, so the whole figure is
 * federal plus FICA and both sides compute it identically. New York does not
 * have that luxury, and the difference is documented in SETTLED below rather
 * than papered over.
 */
const takeHomeAnnual =
  EXAMPLE_MOVE.salary -
  estimateTaxAnnual(EXAMPLE_MOVE.salary, 0, 0, EXAMPLE_MOVE.stateCode) -
  // New York City's own income tax. Nothing upstream prices it — /api/tax
  // takes a state — and on this salary it is $190 a month, which moves the
  // band the ad quotes by a whole rounding step in both directions.
  localTaxAnnual(EXAMPLE_MOVE.city, EXAMPLE_MOVE.salary - STANDARD_DEDUCTION_2026_SINGLE)
const takeHomeMonthly = takeHomeAnnual / 12

const rent = calculateRentRange(takeHomeMonthly, 0)
const upfront = calculateUpfrontCash(rent, takeHomeMonthly)

/** What the first paint shows, before the tax API answers. */
export const RENT_EXAMPLE = {
  salary: EXAMPLE_MOVE.salary,
  city: EXAMPLE_MOVE.city,
  takeHomeMonthly,
  /** What the listing sites allow, on gross. The number the ad argues with. */
  listingSite: listingSiteRentMonthly(EXAMPLE_MOVE.salary),
  rentLow: rent.low,
  rentHigh: rent.high,
  upfrontLow: upfront.low,
  upfrontHigh: upfront.high,
} as const

/**
 * What the page settles on once /api/tax answers, and therefore what the ad
 * must quote.
 *
 * Nobody reads a page in the 500ms before the API responds, so the settled
 * figures are the ones a visitor will actually compare against the creative.
 *
 * Measured against the live route on 18 September 2026, $70,000 in NY:
 * federal $6,570, state $2,799, FICA $5,355, net $55,276 a year.
 *
 * The state figure is the whole delta. lib/firstPaycheck/calculation.ts holds
 * one effective rate per state, and its comments record those as percentages
 * OF GROSS — New York at 4.0%, which is exactly what the API charges. The
 * callers then apply that rate to TAXABLE income, after the federal standard
 * deduction, so $53,900 x 4% gives $2,156 against the API's $2,799. Every
 * local estimate in every tool understates state tax by the deduction times
 * the rate. That is worth fixing on its own terms, across all the tools that
 * read the table, rather than as a side effect of an ad campaign.
 *
 * Here it moves one number: the top of the band, by $25. The bottom of the
 * band and the upfront total are identical either way.
 */
const SETTLED_NET_ANNUAL = 55_276
const settledMonthly =
  (SETTLED_NET_ANNUAL -
    localTaxAnnual(EXAMPLE_MOVE.city, EXAMPLE_MOVE.salary - STANDARD_DEDUCTION_2026_SINGLE)) /
  12
const settledRent = calculateRentRange(settledMonthly, 0)
const settledUpfront = calculateUpfrontCash(settledRent, settledMonthly)

export const RENT_EXAMPLE_SETTLED = {
  takeHomeMonthly: settledMonthly,
  rentLow: settledRent.low,
  rentHigh: settledRent.high,
  upfrontLow: settledUpfront.low,
} as const
