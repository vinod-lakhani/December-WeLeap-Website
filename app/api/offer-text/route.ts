import { forwardTextPilot, offerPayload } from '@/lib/text-pilot'

/**
 * POST /api/offer-text — the offer calculator's "Text me the breakdown" call. The checks and the forward to
 * the WeLeap backend are shared with the rent route (lib/text-pilot.ts). The page builds the offer payload
 * (lib/offer/textPayload.ts); this only checks it is complete. Needs OFFERPILOT_URL and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

export function POST(req: Request) {
  return forwardTextPilot(req, { tool: 'offer', urlEnv: 'OFFERPILOT_URL', buildPayload: offerPayload })
}
