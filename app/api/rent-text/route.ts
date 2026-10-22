import { forwardTextPilot } from '@/lib/text-pilot'

/**
 * POST /api/rent-text — the rent calculator's "Text me the breakdown" call. The checks and the forward to the
 * WeLeap backend are shared with the offer route (lib/text-pilot.ts); this file is only the rent figures.
 * Needs RENTPILOT_URL and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

export function POST(req: Request) {
  return forwardTextPilot(req, { tool: 'rent', urlEnv: 'RENTPILOT_URL', buildPayload: rentPayload })
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

/** The rent calculator's figures as the backend's rent result. Null when the calculator has not run. */
function rentPayload(p: Record<string, unknown>): Record<string, unknown> | null {
  const rentLow = num(p.rentRangeLow)
  const rentHigh = num(p.rentRangeHigh)
  const takeHome = num(p.takeHomeMonthly)
  const upfrontLow = num(p.upfrontCashLow)
  const upfrontHigh = num(p.upfrontCashHigh)
  if (rentLow === null || rentHigh === null || takeHome === null || upfrontLow === null || upfrontHigh === null) {
    return null
  }
  // The named fields the backend's first text and checks read. Every value also goes as figures, below.
  const tax = (p.taxBreakdown ?? {}) as Record<string, unknown>
  const budget = (p.budgetBreakdown ?? {}) as Record<string, unknown>
  const up = (p.upfrontBreakdown ?? {}) as Record<string, unknown>
  const fm = (p.firstMove ?? {}) as Record<string, unknown>
  const debt = Number(p.debtMonthly)
  const id = crypto.randomUUID()
  return {
    id,
    toolVersion: 'rent-tool-web',
    // Inputs for the record. No phone number here.
    inputs: {
      salary: p.salary,
      city: p.city,
      startDate: p.startDate,
      debtMonthly: p.debtMonthly,
      locationMode: p.locationMode,
      presetCity: p.presetCity,
      stateName: p.stateName,
      regionName: p.regionName,
    },
    result: {
      id,
      // Every value the calculator shows, as it sent them.
      figures: p,
      rentLow,
      rentHigh,
      takeHomeMonthly: takeHome,
      upfrontLow,
      upfrontHigh,
      marketLow: num(p.marketLow) ?? undefined,
      marketHigh: num(p.marketHigh) ?? undefined,
      grossAnnual: num(tax.grossAnnual) ?? undefined,
      budgetNeeds: num(budget.needs) ?? undefined,
      budgetWants: num(budget.wants) ?? undefined,
      budgetSavings: num(budget.savings) ?? undefined,
      federalTaxAnnual: num(tax.federalTaxAnnual) ?? undefined,
      stateTaxAnnual: num(tax.stateTaxAnnual) ?? undefined,
      ficaTaxAnnual: num(tax.ficaTaxAnnual) ?? undefined,
      totalTaxAnnual: num(tax.totalTaxAnnual) ?? undefined,
      takeHomeAnnual: num(p.takeHomeAnnual) ?? undefined,
      daysUntilStart: num(p.daysUntilStart) ?? undefined,
      startDate: str(p.startDate),
      debtMonthly: Number.isFinite(debt) && debt > 0 ? debt : undefined,
      location: str(p.regionName) ?? str(p.presetCity) ?? str(p.stateName) ?? str(p.city),
      marketMedian: num(p.medianRent) ?? undefined,
      marketTier: str(p.marketTier),
      marketComparison: str(p.marketComparison),
      gapDays: num(up.gapDays) ?? undefined,
      depositLow: num(up.depositLow) ?? undefined,
      depositHigh: num(up.depositHigh) ?? undefined,
      firstMonthLow: num(up.firstMonthLow) ?? undefined,
      firstMonthHigh: num(up.firstMonthHigh) ?? undefined,
      gapLivingCosts: num(up.gapLivingCosts) ?? undefined,
      movingSetup: num(up.movingSetup) ?? undefined,
      firstMoveMonthly: num(fm.monthlySaving) ?? undefined,
      firstMoveThirtyYear: num(fm.thirtyYearValue) ?? undefined,
    },
  }
}
