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
