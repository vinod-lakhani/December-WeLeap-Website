/**
 * BNPL providers and their late fees.
 *
 * ⚠ THESE FIGURES ARE NOT YET VERIFIED AND ARE THE ONE THING BLOCKING LAUNCH.
 *
 * They came across from the prototype unchanged. Before this page goes live,
 * each needs checking against the provider's current published terms and the
 * `verifiedOn` date set — they vary by state (Afterpay's cap is the greater of
 * a flat fee or a share of order value in some jurisdictions) and providers
 * revise them. Publishing a specific dollar figure per named company is a
 * factual claim about that company, so it carries more risk than the rest of
 * the page.
 *
 * `feeNote` is what the user sees, and is deliberately hedged ("up to").
 * The UI also states that fees vary by state.
 */

export interface Provider {
  name: string
  /** Typical published maximum per missed installment, USD. 0 = none charged. */
  lateFee: number
  /** Shown to the user. Keep hedged. */
  feeNote: string
}

/** Set once each `lateFee` has been checked against current published terms. */
export const FEES_VERIFIED_ON: string | null = null

export const PROVIDERS: Provider[] = [
  { name: 'Klarna', lateFee: 7, feeNote: 'up to $7' },
  { name: 'Afterpay', lateFee: 8, feeNote: 'up to $8' },
  { name: 'Affirm', lateFee: 0, feeNote: 'no late fees' },
  { name: 'Sezzle', lateFee: 5, feeNote: 'around $5' },
  { name: 'Zip', lateFee: 7, feeNote: 'up to $7' },
  { name: 'PayPal Pay in 4', lateFee: 0, feeNote: 'no late fees' },
  { name: 'Other', lateFee: 7, feeNote: 'typically around $7' },
]

const BY_NAME = new Map(PROVIDERS.map((p) => [p.name, p]))

export function providerFee(name: string): number {
  return BY_NAME.get(name)?.lateFee ?? 0
}

export function providerNote(name: string): string {
  return BY_NAME.get(name)?.feeNote ?? ''
}
