import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit, clientKey, __resetRateLimits, HOURLY_LIMIT, DAILY_LIMIT,
} from './rate-limit'

const T0 = 1_770_000_000_000 // a fixed instant; the module never reads the clock
const MIN = 60_000
const HOUR = 60 * MIN

beforeEach(() => __resetRateLimits())

describe('checkRateLimit', () => {
  it('allows up to the hourly limit and then stops', () => {
    for (let i = 0; i < HOURLY_LIMIT; i++) {
      expect(checkRateLimit('ip', T0 + i * MIN).allowed).toBe(true)
    }
    const denied = checkRateLimit('ip', T0 + HOURLY_LIMIT * MIN)
    expect(denied.allowed).toBe(false)
    expect(denied.window).toBe('hour')
  })

  it('lets the caller back in once the hour has passed', () => {
    for (let i = 0; i < HOURLY_LIMIT; i++) checkRateLimit('ip', T0 + i * MIN)
    expect(checkRateLimit('ip', T0 + 30 * MIN).allowed).toBe(false)
    expect(checkRateLimit('ip', T0 + HOUR + MIN).allowed).toBe(true)
  })

  it('keeps the window sliding while a blocked caller keeps trying', () => {
    // A denied attempt is still recorded, so hammering does not let the window
    // drain underneath the attacker.
    for (let i = 0; i < HOURLY_LIMIT; i++) checkRateLimit('ip', T0)
    for (let i = 0; i < 50; i++) checkRateLimit('ip', T0 + 50 * MIN)
    expect(checkRateLimit('ip', T0 + 59 * MIN).allowed).toBe(false)
  })

  it('enforces the daily limit across separate hours', () => {
    let allowed = 0
    // Four spread-out hours, well inside a day.
    for (let h = 0; h < 6; h++) {
      for (let i = 0; i < HOURLY_LIMIT; i++) {
        if (checkRateLimit('ip', T0 + h * HOUR + i * MIN).allowed) allowed++
      }
    }
    expect(allowed).toBe(DAILY_LIMIT)
    expect(checkRateLimit('ip', T0 + 6 * HOUR).window).toBe('day')
  })

  it('counts each caller separately', () => {
    for (let i = 0; i < HOURLY_LIMIT; i++) checkRateLimit('a', T0)
    expect(checkRateLimit('a', T0).allowed).toBe(false)
    expect(checkRateLimit('b', T0).allowed).toBe(true)
  })

  it('reports when the caller may retry', () => {
    for (let i = 0; i < HOURLY_LIMIT; i++) checkRateLimit('ip', T0)
    const denied = checkRateLimit('ip', T0 + 10 * MIN)
    // The oldest hit falls out of the hour window 50 minutes from now.
    expect(denied.retryAfterSeconds).toBeGreaterThan(49 * 60)
    expect(denied.retryAfterSeconds).toBeLessThanOrEqual(50 * 60)
  })
})

describe('clientKey', () => {
  it('takes the client from the front of x-forwarded-for', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' }))).toBe('203.0.113.7')
  })

  it('prefers x-real-ip, which is the address the platform sets', () => {
    // Reading it avoids the question of what x-forwarded-for contains, and in
    // what order, once a request has crossed more than one proxy.
    expect(clientKey(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9')
    expect(
      clientKey(new Headers({ 'x-real-ip': '198.51.100.9', 'x-forwarded-for': '203.0.113.7' })),
    ).toBe('198.51.100.9')
  })

  it('returns null for a caller it cannot identify, rather than one shared key', () => {
    /**
     * This used to return 'unknown', so every unidentifiable caller shared one
     * bucket — and a shared bucket is a site-wide outage waiting for its
     * twelfth request. The old reasoning, that an exemption for "no IP" is an
     * exemption anyone can claim, is true and is the smaller risk: this
     * limiter's own comment says it is not the defence against a distributed
     * attack, the WAF is. Everyone losing uploads because one bucket filled is
     * the larger failure, and it is the one that happened in production.
     */
    expect(clientKey(new Headers())).toBeNull()
    expect(clientKey(new Headers({ 'x-forwarded-for': '   ' }))).toBeNull()
  })

  it('lets an unidentifiable caller through instead of bucketing them together', () => {
    __resetRateLimits()
    for (let i = 0; i < HOURLY_LIMIT + 5; i++) {
      expect(checkRateLimit(null, i * 1_000).allowed, `request ${i}`).toBe(true)
    }
  })
})

describe('recovering from the limit', () => {
  const MIN = 60_000

  it('lets a blocked visitor back in after the hour, even if they kept trying', () => {
    /**
     * The production bug, and the reason uploads stopped working rather than
     * merely being capped.
     *
     * Denied requests used to be recorded, so every retry pushed the window
     * forward. Measured: a visitor retrying every five minutes from a full
     * bucket was still blocked three hours later, while one who waited in
     * silence got back in after sixty-one minutes. The page tells them to give
     * it an hour. Clicking upload during that hour restarted the hour.
     */
    __resetRateLimits()
    let t = 0
    for (let i = 0; i < HOURLY_LIMIT; i++) {
      expect(checkRateLimit('ip', t).allowed).toBe(true)
      t += MIN
    }

    // Retry every five minutes, as somebody looking at a failed upload does.
    let recoveredAt: number | null = null
    for (let i = 0; i < 36 && recoveredAt === null; i++) {
      t += 5 * MIN
      if (checkRateLimit('ip', t).allowed) recoveredAt = t
    }

    expect(recoveredAt, 'never recovered while retrying').not.toBeNull()
    // The first hit was at t=0, so the hour clears about then — not three
    // hours later, and not never.
    expect(recoveredAt! / MIN).toBeLessThan(70)
  })

  it('still refuses every request while the window is genuinely full', () => {
    // Not counting denials must not soften the limit itself.
    __resetRateLimits()
    for (let i = 0; i < HOURLY_LIMIT; i++) checkRateLimit('ip2', 0)
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit('ip2', 1_000).allowed, `retry ${i}`).toBe(false)
    }
  })
})
