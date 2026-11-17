import { NextResponse } from 'next/server'

import { clientKey, makeRateLimiter } from '@/lib/offer-parse/rate-limit'
import { previewRequest, previewValues } from '@/lib/ribbit/preview'

/**
 * POST /api/ribbit-preview — rent arm D's net worth: the app backend's own projection (financial-plan
 * PreviewNetWorth, through the users service's /internal/rentpilot/preview) for a plan that is not saved yet, so the
 * chat shows the number the app will show. Body: NetWorthPreviewInput (lib/ribbit/engine.ts). Answers
 * { values }: net worth a year, from now to 40 years. Nothing is stored. Needs RENTPILOT_URL and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

// A thread calls it three times (the reveal, then the plan with and without the leaps).
const limiter = makeRateLimiter({ hourly: 60, daily: 200 })

export async function POST(req: Request) {
  const limit = limiter.check(clientKey(req.headers), Date.now())
  if (!limit.allowed) return NextResponse.json({ error: 'rate limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } })
  const base = process.env.RENTPILOT_URL
  const key = process.env.RENTPILOT_KEY
  if (!base || !key) {
    console.error(JSON.stringify({ at: 'ribbit-preview', reason: 'no_env' }))
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
  const body = previewRequest(await req.json().catch(() => null))
  if (!body) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const started = Date.now()
  try {
    const res = await fetch(new URL('/internal/rentpilot/preview', base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const values = res.ok ? previewValues(await res.json().catch(() => null)) : null
    if (!values) {
      console.error(JSON.stringify({ at: 'ribbit-preview', reason: 'status', status: res.status, ms: Date.now() - started }))
      return NextResponse.json({ error: 'unavailable' }, { status: 502 })
    }
    return NextResponse.json({ values })
  } catch (err) {
    console.error(JSON.stringify({ at: 'ribbit-preview', reason: 'fetch_error', ms: Date.now() - started, error: err instanceof Error ? err.name : 'unknown' }))
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}
