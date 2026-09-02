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

  it('groups requests with no forwarded address rather than exempting them', () => {
    // An exemption for "no IP" is an exemption anyone can claim.
    expect(clientKey(new Headers())).toBe('unknown')
    expect(clientKey(new Headers({ 'x-forwarded-for': '   ' }))).toBe('unknown')
  })
})
