import { NextResponse } from 'next/server'

/**
 * POST /api/rent-text — the calculator's "Text me this breakdown" call.
 *
 * Forwards the calculator's own output to the WeLeap backend, which saves the run and decides
 * whether a text may go out. The phone number is never logged. Refuses any consent version other
 * than the approved one. Needs RENTPILOT_URL and RENTPILOT_KEY; without them it refuses to run.
 */
export const runtime = 'nodejs'

const APPROVED_CONSENT_VERSION = 'variant-a-v1'
const E164_US = /^\+1\d{10}$/

type Body = {
  phone?: string
  consent?: boolean
  consentVersion?: string
  planData?: Record<string, unknown>
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export async function POST(req: Request) {
  const url = process.env.RENTPILOT_URL
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
  if (body.consent !== true || body.consentVersion !== APPROVED_CONSENT_VERSION) {
    return NextResponse.json({ error: 'Consent is required.' }, { status: 400 })
  }

  const p = body.planData ?? {}
  const rentLow = num(p.rentRangeLow)
  const rentHigh = num(p.rentRangeHigh)
  const takeHome = num(p.takeHomeMonthly)
  const upfrontLow = num(p.upfrontCashLow)
  const upfrontHigh = num(p.upfrontCashHigh)
  if (rentLow === null || rentHigh === null || takeHome === null || upfrontLow === null || upfrontHigh === null) {
    return NextResponse.json({ error: 'Run the calculator first.' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const payload = {
    id,
    phone: body.phone,
    consentVersion: APPROVED_CONSENT_VERSION,
    consentAt: new Date().toISOString(),
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
      rentLow,
      rentHigh,
      takeHomeMonthly: takeHome,
      upfrontLow,
      upfrontHigh,
    },
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
    console.error('[rent-text] backend status', res.status)
    return NextResponse.json({ error: 'We could not send that. Try again later.' }, { status: 502 })
  } catch {
    console.error('[rent-text] backend unreachable')
    return NextResponse.json({ error: 'We could not send that. Try again later.' }, { status: 502 })
  }
}
