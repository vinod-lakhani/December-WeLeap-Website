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

/**
 * Uploads allowed per IP per hour, and per day.
 *
 * Was 5 an hour, which a legitimate session exhausts without trying. The real
 * flow is two documents — the offer letter and the benefits guide, because the
 * match formula is only in the second — and comparing two offers is four. One
 * failed parse retried once puts an ordinary visitor at the ceiling.
 *
 * A blocked request costs nothing: the check runs ahead of the model call.
 * What the limit is protecting against is a loop, and a loop is still stopped
 * dead at twelve.
 */
export const HOURLY_LIMIT = 12
export const DAILY_LIMIT = 40

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
/**
 * Which header identified the caller, for the log line.
 *
 * The address itself is never logged — it is personal data on an endpoint that
 * handles offer letters. What is worth knowing is whether the key is varying
 * at all, because a limiter that resolves every caller to the same value looks
 * exactly like a limiter working correctly until uploads stop for everybody.
 */
export function clientKeySource(headers: Headers): 'x-real-ip' | 'x-forwarded-for' | 'none' {
  if (headers.get('x-real-ip')?.trim()) return 'x-real-ip'
  if (headers.get('x-forwarded-for')?.split(',')[0]?.trim()) return 'x-forwarded-for'
  return 'none'
}

export function clientKey(headers: Headers): string | null {
  /**
   * `x-real-ip` first. Vercel sets it to the client address, and reading it
   * avoids the question of what `x-forwarded-for` contains and in what order
   * once a request has crossed more than one proxy.
   */
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real

  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (first) return first

  /**
   * NULL, NOT 'unknown'.
   *
   * Grouping every unidentifiable caller under one key was the decision that
   * turned a per-IP cap into a site-wide outage: one shared bucket, twelve
   * requests, and uploads are off for everyone who lands in it. The original
   * reasoning — that an exemption for "no IP" is an exemption anyone can claim
   * — is true and is the smaller risk. A caller who can suppress the header
   * gets past a limiter whose own comment says it is not the defence against a
   * distributed attack; the WAF is. Every visitor losing uploads because one
   * bucket filled is the larger failure, and it is the one that happened.
   */
  return null
}

/**
 * Records the request and says whether it may proceed.
 *
 * Counting happens on the ATTEMPT, not on success. Charging only for
 * successful parses would let a caller retry a malformed file indefinitely,
 * and the model call is the expensive part whether or not it returns fields.
 */
export function checkRateLimit(key: string | null, now: number): RateLimitResult {
  // Unidentifiable caller: let it through. See clientKey.
  if (key === null) return { allowed: true }

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

  /**
   * ONLY ACCEPTED REQUESTS ARE RECORDED.
   *
   * Denied ones used to be counted too, on the reasoning that hammering the
   * endpoint while blocked should keep the window sliding forward rather than
   * resetting it. The effect was that it never stopped sliding. A visitor who
   * retried every five minutes was measured, from a full bucket, as still
   * blocked three hours later — while one who waited quietly got back in after
   * sixty-one minutes. The page tells them to give it an hour, and clicking
   * upload during that hour restarted the hour.
   *
   * There is nothing to protect by counting a denial. The limiter runs ahead
   * of the model call, so a blocked request costs nothing, and a caller in a
   * loop is refused every time either way.
   */
  if (!denied) {
    bucket.hits.push(now)
    buckets.set(key, bucket)
  }

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
