/**
 * The text door the rent and offer calculators share: the copy counsel approved, the consent versions the
 * routes accept, phone handling, and the POST both API routes run. One place, so the page and the routes
 * cannot disagree about which wording is approved. Client-safe: no server-only imports.
 */

export type TextPilotTool = 'rent' | 'offer'

/**
 * The approved wording for each calculator. Tapping the button is the consent; there is no checkbox. `sms` is the
 * phone wording, where the button opens Messages with `body` already written and sending it is the consent.
 */
export const TEXT_PILOT_COPY = {
  rent: {
    consentVersion: 'variant-a-v4',
    headline: 'Ask Ribbit anything about your rent or money. Answers come by text.',
    consent:
      'By tapping the button, you agree to get texts from Ribbit from WeLeap with your breakdown, answers to your rent and money questions, and follow-up questions about your rent and money: up to 6 texts over the first 3 weeks, plus replies to anything you send, then Friday check-ins if you turn them on (up to 4 a month). Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
    sms: {
      consentVersion: 'rent-sms-v1',
      button: 'Text me my breakdown',
      body: 'Text me my rent breakdown',
      consent:
        'Tapping the button opens Messages with a text to Ribbit from WeLeap. By sending it, you agree to get texts from Ribbit with your breakdown, answers to your rent and money questions, and follow-up questions about your rent and money: up to 6 texts over the first 3 weeks, plus replies to anything you send, then Friday check-ins if you turn them on (up to 4 a month). Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
    },
  },
  offer: {
    consentVersion: 'offer-a-v2',
    headline: 'Ask Ribbit anything about your offer, rent or money. Answers come by text.',
    consent:
      'By tapping the button, you agree to get texts from Ribbit from WeLeap with your breakdown, answers to your offer, rent and money questions, and follow-up questions about your offer and money: up to 6 texts over the first 3 weeks, plus replies to anything you send. Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
    sms: {
      consentVersion: 'offer-sms-v1',
      button: 'Text me my breakdown',
      body: 'Text me my offer breakdown',
      consent:
        'Tapping the button opens Messages with a text to Ribbit from WeLeap. By sending it, you agree to get texts from Ribbit with your breakdown, answers to your offer, rent and money questions, and follow-up questions about your offer and money: up to 6 texts over the first 3 weeks, plus replies to anything you send. Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
    },
  },
} as const

/** The line under the headline, the same for both calculators. */
export const TEXT_PILOT_SUBLINE = 'General answers from your numbers, not personal financial advice.'

/**
 * The versions each route accepts: the wording shown now, and earlier wordings opt-ins were recorded under.
 * Earlier opt-ins stand without opting in again.
 */
export const ACCEPTED_CONSENT_VERSIONS: Record<TextPilotTool, readonly string[]> = {
  rent: ['variant-a-v1', 'variant-a-v2', 'variant-a-v3', TEXT_PILOT_COPY.rent.consentVersion],
  offer: ['offer-a-v1', TEXT_PILOT_COPY.offer.consentVersion],
}

const E164_US = /^\+1\d{10}$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** US numbers only for the pilot. Returns E.164 or null. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

type Body = {
  phone?: string
  consent?: boolean
  consentVersion?: string
  planData?: Record<string, unknown>
  /** The phone path: "ref" saves the result and returns its code; "tap" says the button was tapped. */
  method?: 'ref' | 'tap'
  id?: string
}

/** Which phone the page is on, from the user agent. Null is everything else, which gets the number form. */
export function phonePlatform(userAgent: string, maxTouchPoints = 0): 'ios' | 'android' | null {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return null
}

/** The link that opens Messages with the text written. iOS and Android separate the body differently. */
export function smsHref(to: string, body: string, platform: 'ios' | 'android'): string {
  return `sms:${to}${platform === 'ios' ? '&' : '?'}body=${encodeURIComponent(body)}`
}

/** The text the phone path sends: the tool's approved words, then the code that finds the result. */
export function smsBody(tool: TextPilotTool, ref: string): string {
  return `${TEXT_PILOT_COPY[tool].sms.body} (ref ${ref})`
}

/**
 * The POST both routes run. Checks the phone and the tool's consent versions, lets the tool turn the
 * calculator's figures into the backend's payload (null when the calculator has not run), and forwards it
 * to the WeLeap backend with the shared key. The phone number is never logged.
 */
export async function forwardTextPilot(
  req: Request,
  opts: {
    tool: TextPilotTool
    urlEnv: 'RENTPILOT_URL' | 'OFFERPILOT_URL'
    buildPayload: (planData: Record<string, unknown>) => Record<string, unknown> | null
  },
): Promise<Response> {
  const url = process.env[opts.urlEnv]
  const key = process.env.RENTPILOT_KEY
  if (!url || !key) {
    return json({ error: 'Text pilot is not configured.' }, 503)
  }
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }
  if (body.method) {
    return forwardPhonePath(url, key, opts, body)
  }
  if (!body.phone || !E164_US.test(body.phone)) {
    return json({ error: 'Enter a US phone number.' }, 400)
  }
  if (body.consent !== true || !ACCEPTED_CONSENT_VERSIONS[opts.tool].includes(body.consentVersion ?? '')) {
    return json({ error: 'Consent is required.' }, 400)
  }
  const built = opts.buildPayload(body.planData ?? {})
  if (!built) {
    return json({ error: 'Run the calculator first.' }, 400)
  }
  const payload = { ...built, phone: body.phone, consentVersion: body.consentVersion, consentAt: new Date().toISOString() }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.status === 202) return json({ sent: false, reason: data.reason ?? 'not_enabled' }, 202)
    if (res.ok) return json({ sent: true })
    console.error(`[${opts.tool}-text] backend status`, res.status)
  } catch {
    console.error(`[${opts.tool}-text] backend unreachable`)
  }
  return json({ error: 'We could not send that. Try again later.' }, 502)
}

/**
 * The phone path's two calls. Neither sends a text, so neither carries a phone number or consent: sending the
 * pre-written text is the consent, and the backend records it when the text arrives.
 */
async function forwardPhonePath(
  url: string,
  key: string,
  opts: { tool: TextPilotTool; buildPayload: (planData: Record<string, unknown>) => Record<string, unknown> | null },
  body: Body,
): Promise<Response> {
  let payload: Record<string, unknown>
  if (body.method === 'tap') {
    if (!body.id) return json({ error: 'Bad request.' }, 400)
    payload = { id: body.id, method: 'tap' }
  } else if (body.method === 'ref') {
    const built = opts.buildPayload(body.planData ?? {})
    if (!built) return json({ error: 'Run the calculator first.' }, 400)
    payload = { ...built, method: 'ref' }
  } else {
    return json({ error: 'Bad request.' }, 400)
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    if (body.method === 'tap') return new Response(null, { status: res.ok ? 204 : 502 })
    const data = (await res.json().catch(() => ({}))) as { ref?: string; to?: string }
    if (res.ok && data.ref && data.to) return json({ ref: data.ref, to: data.to, id: payload.id })
    console.error(`[${opts.tool}-text] backend status`, res.status)
  } catch {
    console.error(`[${opts.tool}-text] backend unreachable`)
  }
  return json({ error: 'Not available.' }, 502)
}
