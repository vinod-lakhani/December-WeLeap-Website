import { getPostHog } from "@/lib/posthog-lazy"

/**
 * Campaign attribution across a session, and across the domain boundary.
 *
 * WAS FIRST TOUCH, AND THAT WAS THE BUG. The capture step used to write the
 * stored UTM set only when the key was empty:
 *
 *   const existing = sessionStorage.getItem(UTM_STORAGE_KEY)
 *   if (!existing) sessionStorage.setItem(UTM_STORAGE_KEY, fromUrl)
 *
 * sessionStorage is per tab and survives same-origin navigation, so the first
 * tagged visit in a tab won for the life of that tab and every later one was
 * discarded. Verified against production: arrive with utm_content=a and cross
 * to the app, come back with b, then c, cross again — the app still received a.
 *
 * That is fatal for a content calendar that separates posts by utm_content,
 * because Instagram's in-app browser reuses one webview session across taps.
 * Every later post's conversions would be credited to whichever post the
 * person happened to tap first.
 *
 * NOW: last touch is what travels, first touch is kept alongside it.
 *
 * MERGED PER KEY, NOT REPLACED WHOLESALE. A URL carrying only utm_content —
 * which happens whenever a link is hand-edited or a redirect drops parameters
 * — must not erase the utm_source and utm_campaign captured on arrival.
 * Overwriting the whole blob on "any UTM present" would do exactly that. The
 * cost of merging is that a genuinely new campaign arriving with a partial set
 * inherits the previous source; that is the better failure, because a blended
 * source is recoverable from the event stream and a missing one is not.
 *
 * The old docblock said this existed "so waitlist/lead forms can attribute
 * signups to the original campaign". No lead form sends UTMs and the lead
 * route reads none, so first touch was protecting a consumer that was never
 * built. It is kept anyway, under its own key, because cohort questions are
 * cheap to preserve and impossible to reconstruct later.
 */

/** Last touch — what gets forwarded to the app. */
const UTM_STORAGE_KEY = "wle_utm"

/** First touch — kept for cohort questions, never overwritten. */
const UTM_FIRST_STORAGE_KEY = "wle_utm_first"

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

export type UtmSet = Partial<Record<(typeof UTM_KEYS)[number], string>>

/* ------------------------------------------------------------------ *
 * Pure core. No window, no storage — so it is testable without a DOM.
 * ------------------------------------------------------------------ */

/** UTM params present in a query string. Absent keys stay absent. */
export function parseUtm(search: string): UtmSet {
  const params = new URLSearchParams(search)
  const out: UtmSet = {}
  UTM_KEYS.forEach((key) => {
    const val = params.get(key)
    if (val) out[key] = val
  })
  return out
}

/** Back to a query string, in a stable key order so equality is comparable. */
export function serializeUtm(utm: UtmSet): string {
  const params = new URLSearchParams()
  UTM_KEYS.forEach((key) => {
    const val = utm[key]
    if (val) params.set(key, val)
  })
  return params.toString()
}

/** True when any UTM key is set. */
export function hasUtm(utm: UtmSet): boolean {
  return UTM_KEYS.some((key) => !!utm[key])
}

/**
 * Incoming values win per key; stored values survive where incoming is silent.
 *
 * This is the whole difference between "the newest post gets the credit" and
 * "the newest post gets the credit and loses the channel it came from".
 */
export function mergeUtm(stored: UtmSet, incoming: UtmSet): UtmSet {
  const out: UtmSet = { ...stored }
  UTM_KEYS.forEach((key) => {
    const val = incoming[key]
    if (val) out[key] = val
  })
  return out
}

/* ------------------------------------------------------------------ *
 * Browser wrappers.
 * ------------------------------------------------------------------ */

function readStored(key: string): UtmSet {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? parseUtm(raw) : {}
  } catch {
    // Throws in private mode and in some in-app browsers. An unattributed
    // visit is a cost; a thrown exception here would break the link itself.
    return {}
  }
}

function writeStored(key: string, utm: UtmSet): void {
  try {
    sessionStorage.setItem(key, serializeUtm(utm))
  } catch {
    // As above.
  }
}

/**
 * Record the current URL's UTMs as last touch, and as first touch if unset.
 *
 * Untagged URLs are ignored entirely, so ordinary in-site navigation cannot
 * wipe attribution captured on arrival.
 */
export function captureUtmIfPresent(): void {
  if (typeof window === "undefined") return
  const fromUrl = parseUtm(window.location.search)
  if (!hasUtm(fromUrl)) return

  writeStored(UTM_STORAGE_KEY, mergeUtm(readStored(UTM_STORAGE_KEY), fromUrl))

  const first = readStored(UTM_FIRST_STORAGE_KEY)
  if (!hasUtm(first)) writeStored(UTM_FIRST_STORAGE_KEY, fromUrl)
}

/**
 * The UTM set to forward, as a query string with no leading "?".
 *
 * Reads the live URL and merges it over storage rather than trusting storage
 * alone. Capture runs in an effect, so a click landing before that effect has
 * run would otherwise forward the previous visit's values — the same staleness
 * this module exists to fix, just in a narrower window.
 */
export function getUtmParams(): string {
  if (typeof window === "undefined") return ""
  return serializeUtm(mergeUtm(readStored(UTM_STORAGE_KEY), parseUtm(window.location.search)))
}

/** First touch, for the cohort question last touch cannot answer. */
export function getFirstTouchUtmParams(): string {
  if (typeof window === "undefined") return ""
  return serializeUtm(readStored(UTM_FIRST_STORAGE_KEY))
}

/**
 * Record how someone entered the site, as a first-touch super property.
 *
 * `src` is not a UTM and deliberately does not join UTM_KEYS. A tool CTA
 * already sends `src=<tool slug>` to the app to attribute a signup, so putting
 * `src` in the stored UTM string would make one parameter mean two different
 * things depending on which direction it was travelling.
 *
 * This is the answer to a narrower question: did this person arrive from a
 * shared link? Registered as a PostHog super property rather than added to
 * each event, so every event the visitor goes on to fire — tool_viewed,
 * tool_completed, tool_cta_clicked, cta_click_signup — carries it without any
 * of those call sites changing. That is what makes the share funnel
 * answerable: before this, a visitor arriving from a share was
 * indistinguishable from an organic one the moment they left the landing page.
 *
 * `register_once`, not `register`: first touch wins. Someone who arrives from
 * a share and returns organically a week later should still be attributed to
 * the share that found them.
 *
 * Deliberately still first touch while the UTMs above became last touch. The
 * two answer different questions — "what found this person" versus "what
 * brought them back this time" — and collapsing them into one policy would
 * lose whichever question was not chosen.
 */
export function captureEntrySourceIfPresent(): void {
  if (typeof window === "undefined") return
  const src = new URLSearchParams(window.location.search).get("src")
  if (!src) return
  // Bounded and character-restricted: this ends up on every subsequent event,
  // so it must not become a channel for arbitrary text from a crafted URL.
  if (!/^[a-z0-9_]{1,32}$/.test(src)) return
  try {
    getPostHog().register_once({ entry_src: src })
  } catch {
    // PostHog unavailable — attribution is lost, the site is not.
  }
}
