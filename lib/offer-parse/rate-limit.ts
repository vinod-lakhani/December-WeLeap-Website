/**
 * A per-IP cap on document uploads, held in the instance's own memory.
 *
 * WHAT THIS IS NOT: a defence against a distributed attack. Serverless
 * instances do not share memory, so an attacker spreading requests across
 * enough concurrent instances gets a multiple of these limits. The Vercel WAF
 * rule is the control for that, and it belongs in the dashboard rather than
 * here — this is the second layer, not the first.
 *
 * WHAT IT IS: the control for the failure this site will actually see. At a few
 * hundred visitors a month, the realistic way `/api/parse-offer` runs up a bill
 * is one person holding down a button or one buggy script in a loop, and both
 * of those arrive on a single warm instance where this stops them dead. It also
 * keeps working when nobody has configured the dashboard rule, which is worth
 * something on an endpoint that spends money per call.
 *
 * Vercel's own rate limiting counts per region, so its configured limit is a
 * floor rather than a ceiling too. Neither layer is exact; together they are
 * enough for an endpoint whose worst case is measured in dollars.
 */

/** Uploads allowed per IP per hour, and per day. From §9 of the parser spec. */
export const HOURLY_LIMIT = 5
export const DAILY_LIMIT = 20

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

interface Bucket {
  /** Timestamps of accepted requests, newest last. */
  hits: number[]
}

const buckets = new Map<string, Bucket>()

/**
 * Bounded so a stream of distinct IPs cannot grow the map without limit — the
 * abuse case would otherwise turn a rate limiter into a memory leak. Eviction
 * is oldest-first, which is the right direction: a caller evicted early is one
 * that has not been seen for a day.
 */
const MAX_TRACKED_IPS = 10_000

export interface RateLimitResult {
  allowed: boolean
  /** Which window was hit, for the log line. Never surfaced to the caller. */
  window?: 'hour' | 'day'
  /** Seconds until the caller may retry, for the Retry-After header. */
  retryAfterSeconds?: number
}

/**
 * `x-forwarded-for` is a list; the client is the first entry.
 *
 * A request with no forwarded address is either local development or something
 * odd, and both are grouped under one key rather than exempted. An exemption
 * for "no IP" is an exemption anyone can claim.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first && first.length > 0 ? first : 'unknown'
}

/**
 * Records the request and says whether it may proceed.
 *
 * Counting happens on the ATTEMPT, not on success. Charging only for
 * successful parses would let a caller retry a malformed file indefinitely,
 * and the model call is the expensive part whether or not it returns fields.
 */
export function checkRateLimit(key: string, now: number): RateLimitResult {
  const bucket = buckets.get(key) ?? { hits: [] }

  // Drop anything older than the longest window before counting.
  bucket.hits = bucket.hits.filter((at) => now - at < DAY_MS)

  const inHour = bucket.hits.filter((at) => now - at < HOUR_MS).length
  const inDay = bucket.hits.length

  const denied: RateLimitResult | null =
    inHour >= HOURLY_LIMIT
      ? { allowed: false, window: 'hour', retryAfterSeconds: retryAfter(bucket.hits, now, HOUR_MS) }
      : inDay >= DAILY_LIMIT
        ? { allowed: false, window: 'day', retryAfterSeconds: retryAfter(bucket.hits, now, DAY_MS) }
        : null

  // A denied request is still remembered, so hammering the endpoint while
  // blocked keeps the window sliding forward rather than resetting it.
  bucket.hits.push(now)
  buckets.set(key, bucket)

  if (buckets.size > MAX_TRACKED_IPS) {
    const oldest = buckets.keys().next()
    if (!oldest.done) buckets.delete(oldest.value)
  }

  return denied ?? { allowed: true }
}

/** Seconds until the oldest hit in the window falls out of it. */
function retryAfter(hits: number[], now: number, windowMs: number): number {
  const inWindow = hits.filter((at) => now - at < windowMs)
  const oldest = inWindow[0]
  if (oldest === undefined) return 1
  return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
}

/** Test seam. Never called by the route. */
export function __resetRateLimits() {
  buckets.clear()
}
