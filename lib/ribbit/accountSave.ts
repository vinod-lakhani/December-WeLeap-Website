/**
 * Rent arm D's sign-up, server side (app/api/ribbit-signup): the app backend's own account calls, made the way the
 * web app makes them (client/webui usersApi.ts): Login with the Firebase ID token, Signup when there is no account
 * yet, then SaveRibbitPlan with the session, which keeps the chat's answers with the account and sends the
 * "plan saved" email. The website calls the gateway from its server: the gateway's CORS allows the app's origin only.
 */

const USERS = '/weleap.users.v1.UsersService'

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
const num = (v: unknown, max = 10_000_000) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v : undefined)

/** RibbitPlanAnswers as protojson, from the chat's dAccountPlan; anything else is dropped (the backend cleans again). */
export function cleanAnswers(raw: unknown): Record<string, unknown> {
  const a = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const split: Record<string, number> = {}
  const rawSplit = a.savingsBreakdown && typeof a.savingsBreakdown === 'object' ? (a.savingsBreakdown as Record<string, unknown>) : {}
  for (const [k, v] of Object.entries(rawSplit).slice(0, 12)) {
    const n = num(v)
    if (/^[A-Za-z0-9]{1,40}$/.test(k) && n) split[k] = n
  }
  const out: Record<string, unknown> = {
    salary: num(a.salary), takeHomeMonthly: num(a.takeHomeMonthly), state: str(a.state, 2), city: str(a.city, 80), rent: num(a.rent),
    matchRatePct: num(a.matchRatePct, 200), matchUpToPct: num(a.matchUpToPct, 100),
    debtBalance: num(a.debtBalance), debtRatePct: num(a.debtRatePct, 100), debtKind: a.debtKind === 'card' || a.debtKind === 'loan' ? a.debtKind : undefined,
    savingsToday: num(a.savingsToday), savingsBreakdown: Object.keys(split).length ? split : undefined,
    efTargetMonths: num(a.efTargetMonths, 12), rentArm: a.rentArm === 'd' ? 'd' : undefined,
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined))
}

/** The email's rows: label and value strings, a few. */
export function cleanRows(raw: unknown): { label: string; value: string }[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 12).flatMap((r) => {
    const label = str((r as Record<string, unknown>)?.label, 80)
    const value = str((r as Record<string, unknown>)?.value, 40)
    return label && value ? [{ label, value }] : []
  })
}

type Call = (rpc: string, body: Record<string, unknown>, token?: string) => Promise<{ status: number; json: Record<string, unknown> }>

/** One Connect unary call (JSON) to the users service through the gateway at `origin`. */
export function usersCaller(origin: string, fetchImpl: typeof fetch = fetch): Call {
  return async (rpc, body, token) => {
    const res = await fetchImpl(`${origin}${USERS}/${rpc}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    return { status: res.status, json: ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown> }
  }
}

export type SaveOutcome =
  | { ok: true; isNew: boolean; emailed: boolean }
  | { ok: false; stage: 'login' | 'signup' | 'save'; status: number; code?: string }

/** Login (or Signup for a new account), then SaveRibbitPlan with the session. */
export async function signInAndSave(call: Call, input: { idToken: string; thread: string; answers: Record<string, unknown>; rows: { label: string; value: string }[] }): Promise<SaveOutcome> {
  let isNew = false
  let auth = await call('Login', { idToken: input.idToken })
  if (auth.status !== 200) {
    if (auth.json.code !== 'not_found') return { ok: false, stage: 'login', status: auth.status, code: String(auth.json.code ?? '') }
    isNew = true
    auth = await call('Signup', { idToken: input.idToken })
    if (auth.status !== 200) return { ok: false, stage: 'signup', status: auth.status, code: String(auth.json.code ?? '') }
  }
  const token = typeof auth.json.token === 'string' ? auth.json.token : ''
  if (!token) return { ok: false, stage: isNew ? 'signup' : 'login', status: auth.status, code: 'no_token' }
  const saved = await call('SaveRibbitPlan', { flow: 'rent', threadId: input.thread, known: input.rows, locked: [], answers: input.answers }, token)
  if (saved.status !== 200) return { ok: false, stage: 'save', status: saved.status, code: String(saved.json.code ?? '') }
  return { ok: true, isNew, emailed: saved.json.sent === true }
}
