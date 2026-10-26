import { forwardTextPilot, rentPayload } from '@/lib/text-pilot'

/**
 * POST /api/rent-text — the rent calculator's "Text me the breakdown" call. The checks and the forward to the
 * WeLeap backend are shared with the offer route (lib/text-pilot.ts); this file is only the rent figures.
 * Needs RENTPILOT_URL and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

export function POST(req: Request) {
  return forwardTextPilot(req, { tool: 'rent', urlEnv: 'RENTPILOT_URL', buildPayload: rentPayload })
}
