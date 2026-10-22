import { NextResponse } from 'next/server'

/**
 * POST /api/offer-text — the offer calculator's "Text me this breakdown" call.
 *
 * Forwards the calculator's own figures to the WeLeap backend's offer start, which saves the run and
 * decides whether a text may go out. The phone number is never logged. Refuses any consent version
 * other than the approved rent wording, which offers share. Needs OFFERPILOT_URL and RENTPILOT_KEY;
 * without them it refuses to run.
 */
export const runtime = 'nodejs'

// Offers use the rent consent wording counsel approved: the same version and the earlier one.
const ACCEPTED_CONSENT_VERSIONS = ['variant-a-v1', 'variant-a-v2']
const E164_US = /^\+1\d{10}$/

type Body = {
  phone?: string
  consent?: boolean
  consentVersion?: string
  planData?: Record<string, unknown>
}

export async function POST(req: Request) {
  const url = process.env.OFFERPILOT_URL
  const key = process.env.RENTPILOT_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Text pilot is not configured.' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  if (!body.phone || !E164_US.test(body.phone)) {
    return NextResponse.json({ error: 'Enter a US phone number.' }, { status: 400 })
  }
  if (body.consent !== true || !ACCEPTED_CONSENT_VERSIONS.includes(body.consentVersion ?? '')) {
    return NextResponse.json({ error: 'Consent is required.' }, { status: 400 })
  }

  const offer = body.planData ?? {}
  if (typeof offer.id !== 'string' || typeof offer.takeHomeMonthly !== 'number' || typeof offer.salary !== 'number') {
    return NextResponse.json({ error: 'Run the calculator first.' }, { status: 400 })
  }

  const payload = {
    id: offer.id,
    phone: body.phone,
    consentVersion: body.consentVersion,
    consentAt: new Date().toISOString(),
    toolVersion: 'offer-tool-web',
    // Inputs for the record. No phone number here.
    inputs: {},
    offer,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.status === 202) return NextResponse.json({ sent: false, reason: data.reason ?? 'not_enabled' }, { status: 202 })
    if (res.ok) return NextResponse.json({ sent: true })
    console.error('[offer-text] backend status', res.status)
    return NextResponse.json({ error: 'We could not send that. Try again later.' }, { status: 502 })
  } catch {
    console.error('[offer-text] backend unreachable')
    return NextResponse.json({ error: 'We could not send that. Try again later.' }, { status: 502 })
  }
}
