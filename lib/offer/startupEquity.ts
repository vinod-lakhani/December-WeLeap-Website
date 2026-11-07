/**
 * Startup equity, worked out from what the person has: the grant, the strike, the last round's price per share and
 * the shares outstanding (spec: "Startup Offer Analyzer: Ribbit Chat Spec"). Never one dollar value added to the
 * package: the investors' price, the value today, the share of the company, and what the company has to sell for
 * before the equity makes up a lower salary. The two assumptions (future rounds and how much each one dilutes) are
 * named wherever a figure depends on them.
 *
 * Arithmetic only, before tax, and on the assumption that a sale is well above what investors put in: below that,
 * investors are paid back first and common stock can get nothing, which the chat says in words.
 */

/** Two more rounds at 20% each: the default the chat states ("after two more rounds"). */
export const FUTURE_ROUNDS = 2
export const DILUTION_PER_ROUND = 0.2
/** The usual grant: four years with a one-year cliff, assumed when the letter or the person doesn't say. */
export const DEFAULT_VEST_YEARS = 4
export const DEFAULT_CLIFF_MONTHS = 12

export type EquityType = 'iso' | 'nso' | 'rsu' | 'restricted_stock'

export interface Grant {
  shares: number
  /** Per share. 0 for RSUs; undefined when the person doesn't know it. */
  strike?: number
  type?: EquityType
  vestYears?: number
}

/** RSUs have nothing to buy; options and restricted stock are bought at the strike. */
export const hasStrike = (g: Grant) => g.type !== 'rsu'

/** The recruiter's number: the grant at the last round's price per share, the price investors paid. */
export const atLastRound = (g: Grant, pricePerShare: number) => g.shares * pricePerShare

/** What buying every share costs, when the strike is known. 0 for RSUs. */
export function costToBuy(g: Grant): number | undefined {
  if (!hasStrike(g)) return 0
  return g.strike === undefined ? undefined : g.shares * g.strike
}

/** The grant as a share of the company, 0 to 1. */
export const ownership = (g: Grant, sharesOutstanding: number) => g.shares / sharesOutstanding

/** The share after future rounds, each giving new investors a slice of everyone's. */
export const afterDilution = (share: number, rounds = FUTURE_ROUNDS, perRound = DILUTION_PER_ROUND) => share * (1 - perRound) ** rounds

/** What the grant pays at a sale price, after dilution and the cost to buy the shares; never below 0. */
export function payoutAt(g: Grant, sharesOutstanding: number, exitValue: number): number {
  const kept = afterDilution(ownership(g, sharesOutstanding)) * exitValue
  return Math.max(0, kept - (costToBuy(g) ?? 0))
}

/**
 * The sale price at which the grant makes up the salary given up over the vesting years, plus the cost to buy the
 * shares. Null when this offer pays as much as the other, so there is nothing to make up.
 */
export function breakEvenExit(g: Grant, sharesOutstanding: number, salaryGapYearly: number): number | null {
  if (salaryGapYearly <= 0) return null
  const years = g.vestYears ?? DEFAULT_VEST_YEARS
  return (salaryGapYearly * years + (costToBuy(g) ?? 0)) / afterDilution(ownership(g, sharesOutstanding))
}

/** "0.10%", "0.06%", "1.5%": two decimals under 1%, one above. */
export function pct(share: number): string {
  const p = share * 100
  return p < 1 ? `${p.toFixed(2)}%` : `${p.toFixed(1)}%`
}

/** A company value as people say it: "$88M", "$1.2B", "$750K". */
export function companyValue(n: number): string {
  if (n >= 1e9) return `$${trim(n / 1e9)}B`
  if (n >= 1e6) return `$${trim(n / 1e6)}M`
  return `$${trim(n / 1e3)}K`
}
const trim = (n: number) => (n >= 100 ? String(Math.round(n)) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10))
