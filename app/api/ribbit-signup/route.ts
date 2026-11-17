import { NextResponse } from 'next/server'

import { clientKey, makeRateLimiter } from '@/lib/offer-parse/rate-limit'
import { cleanAnswers, cleanRows, signInAndSave, usersCaller } from '@/lib/ribbit/accountSave'

/**
 * POST /api/ribbit-signup — rent arm D's sign-up card: { idToken, thread, answers, rows } after the Apple or Google
 * popup. Signs in to (or creates) the WeLeap account and saves the chat's plan with it (lib/ribbit/accountSave.ts).
 * Answers { ok, isNew, emailed }. The ID token is passed on and never logged. Needs RENTPILOT_URL: the app's
 * origin, the same backend as the chat's other calls.
 */
export const runtime = 'nodejs'

const limiter = makeRateLimiter({ hourly: 10, daily: 30 })

export async function POST(req: Request) {
  const limit = limiter.check(clientKey(req.headers), Date.now())
  if (!limit.allowed) return NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } })
  const base = process.env.RENTPILOT_URL
  if (!base) {
    console.error(JSON.stringify({ at: 'ribbit-signup', reason: 'no_env' }))
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
  }
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const idToken = typeof body.idToken === 'string' && body.idToken.length < 8192 ? body.idToken : ''
  if (!idToken) return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
  const thread = typeof body.thread === 'string' ? body.thread.slice(0, 64) : ''
  const started = Date.now()
  try {
    const out = await signInAndSave(usersCaller(new URL(base).origin), { idToken, thread, answers: cleanAnswers(body.answers), rows: cleanRows(body.rows) })
    if (!out.ok) {
      console.error(JSON.stringify({ at: 'ribbit-signup', reason: out.stage, status: out.status, code: out.code, ms: Date.now() - started }))
      return NextResponse.json({ ok: false, error: out.stage }, { status: 502 })
    }
    return NextResponse.json(out)
  } catch (err) {
    console.error(JSON.stringify({ at: 'ribbit-signup', reason: 'fetch_error', ms: Date.now() - started, error: err instanceof Error ? err.name : 'unknown' }))
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 502 })
  }
}
