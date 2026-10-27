import { NextResponse } from 'next/server'

import { clientKey, makeRateLimiter } from '@/lib/offer-parse/rate-limit'
import { offerPayload, rentPayload } from '@/lib/text-pilot'

/**
 * POST /api/ribbit-ask — a typed question in the Ribbit chat (/ribbit_chat). Forwards it, with the person's figures
 * in the same shape the text door sends, to the backend's /internal/rentpilot/ask: the same assistant, bundle and
 * rules as the text thread. Nothing is stored. Rate-limited per visitor, ahead of the model call; the backend also
 * caps questions per thread (the thread id is forwarded) and per day. Needs
 * RENTPILOT_URL (any of its paths; only the origin is used) and RENTPILOT_KEY.
 */
export const runtime = 'nodejs'

const limiter = makeRateLimiter({ hourly: 40, daily: 150 })
// Ribbit could not be reached: the text thread's wording for the same case (an answer it could not give from the
// figures comes back from the backend with its own reason).
const FALLBACK = { kind: 'question', reply: "My answers are down for a moment, so I couldn't get to that one. Send it again in a few minutes." }

export async function POST(req: Request) {
  const limit = limiter.check(clientKey(req.headers), Date.now())
  if (!limit.allowed) {
    return NextResponse.json(
      { kind: 'question', reply: "That's a lot of questions for one sitting. Give it a little while and ask again." },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
    )
  }
  const base = process.env.RENTPILOT_URL
  const key = process.env.RENTPILOT_KEY
  if (!base || !key) return NextResponse.json(FALLBACK, { status: 503 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const flow = body.flow === 'offer' ? 'offer' : 'rent'
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : ''
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })
  const plan = body.planData && typeof body.planData === 'object' ? (body.planData as Record<string, unknown>) : null
  const built = plan ? (flow === 'offer' ? offerPayload(plan) : rentPayload(plan)) : null
  const history = Array.isArray(body.history)
    ? body.history
        .filter((h): h is { role: string; text: string } => !!h && typeof h === 'object' && typeof (h as { text?: unknown }).text === 'string')
        .slice(-12)
        .map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', text: h.text.slice(0, 600) }))
    : []

  try {
    const res = await fetch(new URL('/internal/rentpilot/ask', base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': key },
      body: JSON.stringify({
        tool: flow,
        result: flow === 'rent' ? built?.result : undefined,
        offer: flow === 'offer' ? built?.offer : undefined,
        message,
        step: typeof body.step === 'string' ? body.step.slice(0, 300) : '',
        thread: typeof body.thread === 'string' ? body.thread.slice(0, 64) : '',
        history,
      }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) return NextResponse.json(FALLBACK, { status: 502 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(FALLBACK, { status: 502 })
  }
}
