import { forwardTextPilot } from '@/lib/text-pilot'

/**
 * POST /api/offer-text — the offer calculator's "Text me the breakdown" call. The checks and the forward to
 * the WeLeap backend are shared with the rent route (lib/text-pilot.ts). The page builds the offer payload
 * (lib/offer/textPayload.ts); this only checks it is complete. Needs OFFERPILOT_URL and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

export function POST(req: Request) {
  return forwardTextPilot(req, { tool: 'offer', urlEnv: 'OFFERPILOT_URL', buildPayload: offerPayload })
}

function offerPayload(offer: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof offer.id !== 'string' || typeof offer.takeHomeMonthly !== 'number' || typeof offer.salary !== 'number') {
    return null
  }
  return { id: offer.id, toolVersion: 'offer-tool-web', inputs: {}, offer }
}
