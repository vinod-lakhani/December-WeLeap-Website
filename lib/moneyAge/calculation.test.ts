/**
 * These pin the five corrections in docs/specs/money-age-v2.md.
 *
 * Each one below exists because the draft got it wrong in a way that produced a
 * bad number rather than bad prose — so if a future edit reverts any of them,
 * it should fail here rather than ship.
 */

import { describe, it, expect } from 'vitest'
import { computeMoneyAge, yardstickBalance, rateCredit, priceMove } from './calculation'
import {
  REFERENCE_SAVINGS_RATE,
  RATE_CREDIT_PER_UNIT,
  CAREER_START_AGE,
} from './constants'

const base = { age: 28, income: 70_000, position: 12_000, savingsRate: 0.06 }

describe('the number means what it says', () => {
  it('saving the reference rate with the reference balance puts you at your own age', () => {
    // The property that makes the whole thing interpretable. If it breaks, the
    // number stops being "the age at which they held what you hold".
    for (const age of [25, 30, 35, 40]) {
      const onTrack = yardstickBalance(age, 70_000, age)
      const r = computeMoneyAge({
        age,
        income: 70_000,
        position: onTrack,
        savingsRate: REFERENCE_SAVINGS_RATE,
      })
      expect(r.moneyAge).toBe(age)
      expect(r.deltaYears).toBe(0)
    }
  })

  it('holds regardless of c, which is why c is safe to tune for feel', () => {
    // At s = B the credit is zero for any c. Pinned because the temptation on
    // a hook like this is to tune c, and someone should be able to see that
    // doing so cannot corrupt the meaning.
    expect(rateCredit(REFERENCE_SAVINGS_RATE)).toBe(0)
    expect(RATE_CREDIT_PER_UNIT).toBeGreaterThan(0)
  })

  it('the delta agrees with the age on screen', () => {
    for (const age of [22, 27, 31, 38]) {
      const r = computeMoneyAge({ ...base, age })
      expect(r.deltaYears).toBe(r.moneyAge - age)
    }
  })
})

describe('the yardstick has a career (spec §1.1)', () => {
  it('earns less early than a flat-salary yardstick would', () => {
    // The draft assumed today's salary since 22. For a 35-year-old on $120k
    // that meant being measured against someone earning $120k at 22.
    const career = yardstickBalance(28, 120_000, 35)
    const flat = REFERENCE_SAVINGS_RATE * 120_000 * ((Math.pow(1.05, 6) - 1) / 0.05)
    expect(career).toBeLessThan(flat)
  })

  it('the correction grows with age, because that is where the artefact was', () => {
    // 0.2 years at 26, 3.4 at 40 under the draft's parameters. The direction
    // and the monotonicity are what matter, not the magnitudes.
    const gap = (age: number, income: number) => {
      const n = age - CAREER_START_AGE
      const flat = REFERENCE_SAVINGS_RATE * income * ((Math.pow(1.05, n) - 1) / 0.05)
      return flat - yardstickBalance(age, income, age)
    }
    const g26 = gap(26, 60_000)
    const g35 = gap(35, 120_000)
    expect(g26).toBeGreaterThan(0)
    expect(g35).toBeGreaterThan(g26)
  })
})

describe('the employer match is visible (spec §1.3)', () => {
  it('a matched contribution beats an unmatched one', () => {
    // The draft excluded employer money from the rate, so this gap was 0.0 and
    // the tool said free money changed nothing — while the money plan on the
    // same site is built on taking it first.
    const matched = computeMoneyAge({ ...base, savingsRate: 0.06 + 0.05 })
    const unmatched = computeMoneyAge({ ...base, savingsRate: 0.06 })
    expect(matched.moneyAge).toBeGreaterThan(unmatched.moneyAge)
    expect(matched.moneyAge - unmatched.moneyAge).toBeGreaterThanOrEqual(3)
  })
})

describe('catch-up is the story (spec §1.5)', () => {
  it('a behind user can cross zero on the slider alone', () => {
    const behind = { age: 28, income: 55_000, position: 5_000, savingsRate: 0.03 }
    const start = computeMoneyAge(behind)
    const dragged = computeMoneyAge({ ...behind, savingsRate: 0.20 })
    expect(start.deltaYears).toBeLessThan(0)
    expect(dragged.deltaYears).toBeGreaterThan(start.deltaYears)
    // The swing is the hook. If a tuning change flattens it, this fails.
    expect(dragged.moneyAge - start.moneyAge).toBeGreaterThanOrEqual(6)
  })

  it('never returns an age below the floor', () => {
    const wiped = computeMoneyAge({ age: 24, income: 45_000, position: -8_000, savingsRate: 0 })
    expect(wiped.moneyAge).toBeGreaterThanOrEqual(20)
    expect(wiped.atFloor).toBe(true)
  })
})

describe('income sensitivity is real and should not surprise anyone', () => {
  it('the same balance scores younger on a bigger income', () => {
    // Not a bug: the bar is a share of what you earn. Documented because it
    // means a raise lowers the number, which reads as broken if unexplained.
    const low = computeMoneyAge({ age: 30, income: 45_000, position: 25_000, savingsRate: 0.10 })
    const high = computeMoneyAge({ age: 30, income: 120_000, position: 25_000, savingsRate: 0.10 })
    expect(high.moneyAge).toBeLessThan(low.moneyAge)
  })
})

describe('priceMove refuses to invent a delta', () => {
  it('returns null when a move changes nothing', () => {
    expect(priceMove(base, { position: base.position + 1 })).toBeNull()
  })

  it('prices a real move in years', () => {
    const moved = priceMove(base, { savingsRate: 0.06 + 0.05 })
    expect(moved).not.toBeNull()
    expect(moved!.gain).toBeGreaterThan(0)
    expect(moved!.after).toBeGreaterThan(moved!.before)
  })
})
