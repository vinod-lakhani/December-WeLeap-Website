/**
 * ChatGPT Ads Measurement Pixel (OpenAI), callable from anywhere.
 *
 * Same shape as lib/meta-pixel.ts and for the same reason: the first caller,
 * component or page, creates the `oaiq` stub, queues `init`, and appends the
 * SDK; later calls queue on the stub and flush in order once the SDK loads.
 * So an event fired during hydration, before <OpenAIPixel /> has mounted,
 * is not lost.
 *
 * Gated on the production host rather than an env var, the way
 * lib/google-ads.ts is. A conversion from a preview deployment or localhost
 * is a lie told to a bidding algorithm, and a host check cannot be left
 * half-configured in Vercel the way an unset env var can.
 *
 * The pixel ID is not a secret; it ships in the page either way. It is the
 * data source "WeLeap web pixel" in the OpenAI Ads Manager account.
 *
 * Consent gating is deliberately deferred to the one later change that will
 * cover GA, PostHog, Meta and this together. When that lands, the pixel
 * supports `oaiq("consent", false)` before init and `oaiq("consent", true)`
 * on acceptance; nothing else here moves.
 *
 * The SDK reads the `oppref` click parameter off the landing URL itself and
 * keeps it in its own storage, so nothing on this side has to carry it for
 * same-domain conversions. It is also added to CLICK_ID_KEYS in
 * lib/utm-storage.ts so the handoff to weleap.app carries it for a later
 * server-side signup conversion.
 */
export const OPENAI_PIXEL_ID = 'RCAcWYZUkBMCyUtKWH8SQ5'

const SDK_SRC = 'https://bzrcdn.openai.com/sdk/oaiq.min.js'

/** Hosts a real conversion can come from. Mirrors lib/google-ads.ts. */
const PRODUCTION_HOSTS = new Set(['weleap.ai', 'www.weleap.ai'])

type Oaiq = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    oaiq?: Oaiq
  }
}

/** Whether the pixel may load and events may fire. */
export function openaiPixelEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location?.hostname
  return typeof host === 'string' && PRODUCTION_HOSTS.has(host)
}

/** True when the pixel is enabled and the stub is in place (loads it if not). */
export function loadOpenAIPixel(): boolean {
  if (!openaiPixelEnabled()) return false
  if (window.oaiq) return true
  // Standard setup snippet from Ads Manager, as a function rather than an
  // inline <script> so it can be called from wherever the first event fires.
  const q = function (...args: unknown[]) {
    q.q!.push(args)
  } as Oaiq
  q.q = []
  window.oaiq = q
  const s = document.createElement('script')
  s.async = true
  s.src = SDK_SRC
  document.head.appendChild(s)
  q('init', { pixelId: OPENAI_PIXEL_ID })
  return true
}

/** oaiq(...) that never throws and never fires before init is queued. */
export function oaiq(...args: unknown[]): void {
  try {
    if (loadOpenAIPixel()) window.oaiq!(...args)
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Which weleap.ai events are OpenAI conversions, and as which standard event.
 *
 * Keyed on the event this site fires, the way ADS_CONVERSIONS is, so a tool
 * whose completion is missing here is a bug in this file and not in one of
 * the ten components that emit `tool_completed`.
 *
 * `contents_viewed` is the Ads Manager event "Offer tool result viewed" (it
 * carries the tool name, so the rent chat lands in the same event and is
 * split in reporting by content id). `lead_created` is "App CTA tapped": the
 * taps that hand the visitor to weleap.app or the store, plus the text
 * opt-in, which is the rent chat's conversion and what Google counts for the
 * same campaign. The two channels are being compared, so they must count
 * the same moments.
 */
export const OPENAI_CONVERSIONS: Record<string, 'contents_viewed' | 'lead_created'> = {
  tool_completed: 'contents_viewed',
  tool_cta_clicked: 'lead_created',
  store_link_clicked: 'lead_created',
  ribbit_app_link_clicked: 'lead_created',
  text_optin_submitted: 'lead_created',
}

/**
 * Report one conversion, if this event is one. Fire-and-forget; three of
 * these taps navigate away immediately and nothing may delay that.
 *
 * `event_id`, where the site already minted one for Meta dedupe, goes in the
 * options object so a later Conversions API send of the same event can be
 * deduplicated against it.
 */
export function fireOpenAIConversion(eventName: string, params?: Record<string, unknown>): void {
  try {
    const event = OPENAI_CONVERSIONS[eventName]
    if (!event) return
    const options = typeof params?.event_id === 'string' ? { event_id: params.event_id } : undefined
    if (event === 'contents_viewed') {
      const tool = typeof params?.tool === 'string' ? params.tool : 'unknown'
      oaiq('measure', 'contents_viewed', {
        type: 'contents',
        contents: [{ id: tool, name: tool, content_type: 'tool' }],
      }, options)
      return
    }
    oaiq('measure', 'lead_created', { type: 'customer_action' }, options)
  } catch {
    /* Never let a measurement call break the page, or the events after it. */
  }
}
