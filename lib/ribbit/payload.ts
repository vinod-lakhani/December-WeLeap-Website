/**
 * The chat's facts in the shapes the rest of the system already reads: the rent tool's planData and the offer
 * tool's text payload. The text door (handoff) and Ribbit's question route both take these, so a thread that
 * starts in the chat carries the same figures as one started from a tool page. `source` marks it in the record.
 */
import { calculateBudgetBreakdown, calculateUpfrontCash, rentFirstMove } from '@/lib/rent'
import { computeOfferValue, type TaxResult } from '@/lib/offer/calculate'
import { computeLevers } from '@/lib/offer/levers'
import { offerTextPayload } from '@/lib/offer/textPayload'
import { moneyInputs, offerInputs, type Facts } from './engine'
import { moneyOrder } from './moneyOrder'

export const CHAT_SOURCE = 'ribbit_chat'

function daysUntil(date?: string): number | undefined {
  if (!date) return undefined
  const ms = new Date(`${date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86_400_000)) : undefined
}

/** The rent tool's planData (components/RentTool.tsx), from the chat. Null until there is a range. */
export function rentPlanData(f: Facts): Record<string, unknown> | null {
  if (!f.range || !f.takeHomeMonthly) return null
  const up = calculateUpfrontCash(f.range, f.takeHomeMonthly)
  const tax = f.tax && f.salary
    ? {
        grossAnnual: f.salary,
        federalTaxAnnual: f.tax.federalTaxAnnual,
        stateTaxAnnual: f.tax.stateTaxAnnual + f.tax.localTaxAnnual,
        ficaTaxAnnual: f.tax.ficaTaxAnnual,
        totalTaxAnnual: f.tax.federalTaxAnnual + f.tax.stateTaxAnnual + f.tax.localTaxAnnual + f.tax.ficaTaxAnnual,
        netIncomeAnnual: f.tax.netIncomeAnnual - f.tax.localTaxAnnual,
      }
    : undefined
  return {
    source: CHAT_SOURCE,
    salary: f.salary ? String(f.salary) : undefined,
    city: f.presetCity ?? (f.stateCode ? 'Other' : undefined),
    startDate: f.startDate,
    debtMonthly: f.debtMonthly ? String(f.debtMonthly) : undefined,
    takeHomeMonthly: f.takeHomeMonthly,
    takeHomeAnnual: f.takeHomeMonthly * 12,
    rentRange: f.range.formatted,
    rentRangeLow: f.range.low,
    rentRangeHigh: f.range.high,
    daysUntilStart: daysUntil(f.startDate),
    upfrontCashLow: up.low,
    upfrontCashHigh: up.high,
    budgetBreakdown: calculateBudgetBreakdown(f.takeHomeMonthly),
    taxBreakdown: tax,
    locationMode: f.presetCity ? 'preset' : f.stateCode ? 'other' : undefined,
    presetCity: f.presetCity,
    stateName: f.region?.stateName ?? f.stateCode,
    regionName: f.region?.regionName,
    zoriAvailable: f.market?.source === 'zori',
    marketLow: f.market?.low,
    marketHigh: f.market?.high,
    medianRent: f.market?.median,
    marketTier: f.market?.tier,
    upfrontBreakdown: { depositLow: up.depositLow, firstMonthLow: up.firstMonthLow, gapLivingCosts: up.gapLiving, movingSetup: up.movingSetup },
    firstMove: f.range.high > f.range.low ? rentFirstMove(f.range.low, f.range.high) : undefined,
    pickedRent: f.pick,
    savingFor: f.purpose,
    // The chat's plan, so the first text picks it up rather than restating the range (users/rentpilot.go
    // FirstMessage reads these when source is ribbit_chat).
    perCheck: f.perCheck,
    moveInTarget: f.purpose === 'cushion' ? f.upfront?.high : undefined,
    roommate: f.roommate,
    takeHomeBasis: takeHomeBasis(f),
  }
}

/**
 * What the take-home figure includes, in words, for Ribbit. Before a location it is federal income tax and FICA
 * only; without this, a question like "is that after tax?" was answered as if state tax were in it.
 */
export function takeHomeBasis(f: Facts): string {
  if (f.takeHomeFrom === 'typed') return 'typed by the person as their monthly take-home'
  if (f.takeHomeBeforeState || !f.tax) return 'salary less federal income tax and FICA only; no location yet, so state and city income tax are not taken out'
  const parts = ['federal income tax', f.tax.stateTaxAnnual > 0 ? 'state income tax' : 'no state income tax in this state', ...(f.tax.localTaxAnnual > 0 ? ['city income tax'] : []), 'FICA']
  return `salary less ${parts.join(', ')}`
}

/**
 * The offer tool's text payload (lib/offer/textPayload.ts), from the chat: entered terms only, with the list of
 * which ones were entered, as the offer page sends it. Local income tax folds into the state figure, as the
 * offer page does (taxWithLocal). Null until there is a salary.
 */
export function offerPlanData(f: Facts): Record<string, unknown> | null {
  if (!f.salary || !f.takeHomeMonthly) return null
  const inputs = offerInputs(f)
  const tax: TaxResult | null = f.tax
    ? {
        netIncomeAnnual: f.tax.netIncomeAnnual - f.tax.localTaxAnnual,
        federalTaxAnnual: f.tax.federalTaxAnnual,
        stateTaxAnnual: f.tax.stateTaxAnnual + f.tax.localTaxAnnual,
        ficaTaxAnnual: f.tax.ficaTaxAnnual,
      }
    : null
  const value = computeOfferValue(inputs, tax)
  if (!value) return null
  const entered = ['salary']
  if (f.stateCode) entered.push('jobState')
  if (f.bonusPct !== undefined) entered.push('bonusPct')
  if (f.match === 'known' || f.match === 'none') entered.push('matchRatePct', 'matchUpToPct')
  if (f.rsuAnnual !== undefined) entered.push('rsuAnnual')
  if (f.signingBonus !== undefined) entered.push('signingBonus')
  const payload = offerTextPayload({
    id: crypto.randomUUID(),
    side: { label: 'Offer A', location: f.place ?? '', inputs, value },
    tax,
    levers: computeLevers(inputs, tax),
    comparison: null,
    other: null,
    entered: { fields: entered.sort(), value },
  })
  // The backend reads extra facts from `figures` (OfferResult.Figures), so the basis goes there too.
  const figures = { ...((payload.figures as Record<string, unknown>) ?? {}), takeHomeBasis: takeHomeBasis(f) }
  return { ...payload, figures, source: CHAT_SOURCE }
}

/**
 * What a typed question in "Where should my money go?" sends the reader: the four answers and the order worked out
 * from them (moneyOrder, code, never the model), so it can answer "is now a good time to buy a car?" with their
 * numbers. The backend turns it into the money figures bundle (MoneyBundle).
 */
export function moneyAskData(f: Facts): Record<string, unknown> | undefined {
  if (!f.takeHomeMonthly) return undefined
  const o = moneyOrder(moneyInputs(f))
  return {
    takeHomeMonthly: Math.round(f.takeHomeMonthly),
    rentMonthly: Math.round(f.pick ?? 0),
    leftAfterRent: Math.round(o.leftAfterRent),
    debt: f.debt ? { balance: f.debt.balance, aprPct: f.debt.aprPct, payment: f.debt.payment, kind: f.debt.kind ?? '' } : null,
    debtPlan: o.debtPlan ? { payment: o.debtPlan.payment, months: Number.isFinite(o.debtPlan.months) ? o.debtPlan.months : 0 } : null,
    match: f.match ?? '',
    matchRatePct: f.matchRatePct ?? 0,
    matchUpToPct: f.matchUpToPct ?? 0,
    emergencyGoal: o.emergencyGoal,
    monthlyForSteps: Math.round(o.monthlyForSteps),
    steps: o.steps.map((st) => `${st.title}: ${st.detail}`),
  }
}

