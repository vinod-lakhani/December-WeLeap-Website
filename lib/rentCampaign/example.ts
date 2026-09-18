/**
 * The move in the creative, worked out.
 *
 * The ad runs: "$70,000 in Austin. The listing site says you can afford
 * $1,750/mo. On take-home it's $1,350 to $1,700. And you need about $4,100
 * before you get keys."
 *
 * Every figure below is produced by the same functions that answer a real
 * one — calculateRentRange and calculateUpfrontCash — so the example cannot
 * drift away from what the calculator would say for the same move. If a test
 * in example.test.ts fails, the AD needs rewriting, not the expectation.
 *
 * Austin on purpose. It is a mid-range city, and it is also the least
 * flattering of the six presets for this particular argument: Texas charges no
 * income tax, so take-home is 83% of gross and the top of the rent band lands
 * only $50 under the listing site's number. The claim holds against the bottom
 * of the band everywhere, and in Austin it holds by the smallest margin the
 * tool produces. An example that survives its worst case is one the page can
 * defend in the replies.
 */

import { estimateTaxAnnual } from '@/lib/allocator/takeHome'
import {
  calculateRentRange,
  calculateUpfrontCash,
  listingSiteRentMonthly,
} from '@/lib/rent'

/** The move the creative describes. */
export const EXAMPLE_MOVE = {
  salary: 70_000,
  city: 'Austin',
  stateCode: 'TX',
} as const

/**
 * Take-home from the local table rather than the tax API.
 *
 * The API is what the page uses once it answers, and for this example the two
 * agree to the dollar — Texas has no state tax, so the whole figure is federal
 * plus FICA and both sides compute it the same way. Worth knowing that this is
 * a coincidence of the example rather than a general property: in a graduated
 * state the local table is an approximation and the page swaps in the API's
 * answer when it arrives.
 */
const takeHomeAnnual =
  EXAMPLE_MOVE.salary - estimateTaxAnnual(EXAMPLE_MOVE.salary, 0, 0, EXAMPLE_MOVE.stateCode)
const takeHomeMonthly = takeHomeAnnual / 12

const rent = calculateRentRange(takeHomeMonthly, 0)
const upfront = calculateUpfrontCash(rent, takeHomeMonthly)

export const RENT_EXAMPLE = {
  salary: EXAMPLE_MOVE.salary,
  city: EXAMPLE_MOVE.city,
  takeHomeMonthly,
  /** What the listing sites allow, on gross. The number the ad argues with. */
  listingSite: listingSiteRentMonthly(EXAMPLE_MOVE.salary),
  rentLow: rent.low,
  rentHigh: rent.high,
  /** Cash needed before the first paycheck, at the bottom of the band. */
  upfrontLow: upfront.low,
  upfrontHigh: upfront.high,
} as const
