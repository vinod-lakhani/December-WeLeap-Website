/**
 * Rent arm D's net worth preview, server side (app/api/ribbit-preview): the chat's plan as financial-plan's
 * PreviewNetWorthRequest (protojson), and the response's net worth points as plain values.
 */

/** Bucket names the app's savings_breakdown holds; anything else is dropped. */
const BUCKETS = new Set(['emergencyFund', 'employeeTraditional401k', 'debtPaydown', 'traditionalIRA', 'rothIRA', 'investing'])
const EF_MONTHS: Record<number, string> = { 3: 'EF_TARGET_MONTHS_3', 4: 'EF_TARGET_MONTHS_4', 5: 'EF_TARGET_MONTHS_5', 6: 'EF_TARGET_MONTHS_6', 12: 'EF_TARGET_MONTHS_12' }

const amount = (v: unknown, max = 10_000_000): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v : null)
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null)

/** The body as financial-plan's PreviewNetWorthRequest (protojson), or null when it doesn't hold together. */
export function previewRequest(raw: unknown): Record<string, unknown> | null {
  const b = obj(raw)
  if (!b) return null
  const needs = amount(b.needs)
  const wants = amount(b.wants)
  const savings = amount(b.savings)
  const emergencyFund = amount(b.emergencyFund) ?? 0
  const breakdownIn = obj(b.savingsBreakdown)
  if (needs === null || wants === null || savings === null || !breakdownIn) return null
  const breakdown: Record<string, number> = {}
  for (const [k, v] of Object.entries(breakdownIn)) {
    const n = amount(v)
    if (BUCKETS.has(k) && n) breakdown[k] = Math.round(n)
  }
  const savingsRow: Record<string, unknown> = { efTargetMonths: EF_MONTHS[Number(b.efMonths)] ?? EF_MONTHS[3] }
  const k401 = obj(b.k401)
  if (k401) {
    const pct = amount(k401.pct, 100)
    const rate = amount(k401.matchRatePct, 200)
    const cap = amount(k401.matchUpToPct, 100)
    if (pct && rate !== null && cap !== null) {
      Object.assign(savingsRow, { employerOffers401k: true, employeeContributes401k: true, employeeContributionPercent: pct, employerMatchLimit: rate, employerMatchUpToPayPercent: cap })
    }
  }
  const card = obj(b.card)
  const balance = card ? amount(card.balance) : null
  const liabilities = card && balance
    ? [{ liabilityType: 'credit_card', currentBalance: balance, interestRate: amount(card.aprPct, 100) ?? 0, minimumPayment: amount(card.minimum) ?? 0 }]
    : []
  return {
    incomeAllocation: { needs, wants, savings, savingsBreakdown: JSON.stringify(breakdown) },
    savings: savingsRow,
    liabilities,
    annualGross: amount(b.annualGross) ?? 0,
    emergencyFundBalance: emergencyFund,
  }
}

/** GetNetWorthResponse's net worth points, in year order, as plain values. */
export function previewValues(raw: unknown): number[] | null {
  const points = obj(raw)?.netWorthProjections
  if (!Array.isArray(points)) return null
  const values = points
    .map((p) => obj(p))
    .filter((p): p is Record<string, unknown> => !!p)
    .map((p) => ({ year: Number(p.year ?? 0), value: Number(p.value ?? 0) }))
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year)
    .map((p) => p.value)
  return values.length ? values : null
}
