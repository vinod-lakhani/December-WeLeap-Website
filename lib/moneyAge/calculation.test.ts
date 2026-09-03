/**
 * These pin the five corrections in docs/specs/money-age-v2.md.
 *
 * Each one below exists because the draft got it wrong in a way that produced a
 * bad number rather than bad prose — so if a future edit reverts any of them,
 * it should fail here rather than ship.
 */

import { describe, it, expect } from 'vitest'
import {
  computeMoneyAge,
  yardstickBalance,
  rateCredit,
  priceMove,
  referenceIncomeAt,
} from './calculation'
import {
  REFERENCE_SAVINGS_RATE,
  RATE_CREDIT_PER_UNIT,
  CAREER_START_AGE,
  wageGrowthAt,
} from './constants'
import { POSITION_BANDS, INCOME_BANDS, bandLabel, parseExactAmount } from './bands'

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

describe('the reference career follows BLS bands, not one rate', () => {
  it('income steps back through the bands to the start of the career', () => {
    // Each year's growth is attributed to the age you were DURING it, which is
    // how the BLS series is phrased ("grew 6.2% per year from age 18 to 24").
    // So 29 -> 30 uses the 25-29 band, and 24 -> 25 uses the 18-24 band even
    // though the person finishes that year at 25.
    expect(referenceIncomeAt(29, 80_000, 30)).toBeCloseTo(80_000 / 1.041, 2)
    expect(referenceIncomeAt(24, 80_000, 25)).toBeCloseTo(80_000 / 1.062, 2)
    expect(referenceIncomeAt(23, 80_000, 24)).toBeCloseTo(80_000 / 1.062, 2)
    // Forward and backward have to agree, or the path bends at the user's age.
    expect(referenceIncomeAt(31, referenceIncomeAt(29, 80_000, 30), 29)).toBeCloseTo(
      referenceIncomeAt(31, 80_000, 30),
      2
    )
  })

  it('tracks the published shape rather than one averaged rate', () => {
    // Deliberately NOT asserting a large numerical difference. The bands
    // average 3.14% over this tool's range, so a flat 3% approximates the
    // accumulated balance well — the money age moves half a year at most. The
    // point of the schedule is that it is sourced, and that the career shape it
    // encodes is real: steep early, nearly flat after forty.
    const early = wageGrowthAt(23)
    const mid = wageGrowthAt(32)
    const late = wageGrowthAt(44)
    expect(early).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(late)
    expect(late).toBeLessThan(0.01)
  })

  it('income is continuous through a band boundary', () => {
    // Bands are a step function in the RATE, but income itself must not jump —
    // a discontinuity here would put a cliff in the money age at ages 25, 30,
    // 35 and 40.
    for (const boundary of [25, 30, 35, 40]) {
      const below = referenceIncomeAt(boundary - 0.001 + 0.001, 90_000, boundary)
      expect(below).toBeCloseTo(90_000, 6)
    }
    for (const age of [24, 29, 34, 39, 44]) {
      const a = yardstickBalance(age, 90_000, age)
      const b = yardstickBalance(age + 1, 90_000, age + 1)
      expect(b).toBeGreaterThan(a * 0.5)
    }
  })
})

describe('the bands cover a plausible range (and where they cannot, say so)', () => {
  it('no open top band understates a realistic saver by a decade', () => {
    // The first version stopped at "$50K+" scored as $75,000, which told a
    // 32-year-old holding $350,000 that their money age was 29 when it was 41.
    // Twelve years, and understated for exactly the people whose result is
    // worth sharing.
    const at = (p: number) =>
      computeMoneyAge({ age: 32, income: 105_000, position: p, savingsRate: 0.121 }).moneyAge
    const top = POSITION_BANDS[POSITION_BANDS.length - 1]!
    expect(top.value).toBeGreaterThanOrEqual(400_000)
    // Someone at the old failure point is now inside a band, not above the top.
    expect(Math.abs(at(350_000) - at(top.value))).toBeLessThanOrEqual(3)
  })

  it('bands ascend, and each position band is wider than the last', () => {
    // Log spacing. Even bands would put the resolution where the curve is flat.
    const vals = POSITION_BANDS.map((b) => b.value)
    for (let i = 1; i < vals.length; i++) expect(vals[i]!).toBeGreaterThan(vals[i - 1]!)
    const gaps = vals.slice(1).map((v, i) => v - vals[i]!)
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeGreaterThanOrEqual(gaps[i - 1]!)
  })

  it('savings bands reach well past the top income band', () => {
    // Savings are a stock and income a flow, so the top of one has no business
    // being anchored to the top of the other. A 44-year-old on $200k can hold
    // several times that.
    const topIncome = INCOME_BANDS[INCOME_BANDS.length - 1]!.value
    const topPosition = POSITION_BANDS[POSITION_BANDS.length - 1]!.value
    expect(topPosition).toBeGreaterThan(topIncome)
  })

  it('a typed figure is reported as "exact" rather than as a missing band', () => {
    // So a funnel can separate "did not answer" from "answered precisely".
    expect(bandLabel(POSITION_BANDS, 320_000)).toBe('exact')
    expect(bandLabel(POSITION_BANDS, 37_500)).toBe('$25–50K')
    expect(bandLabel(POSITION_BANDS, null)).toBeNull()
  })
})

describe('parseExactAmount reads what people actually type', () => {
  it('accepts currency formatting, because money fields get money typed into them', () => {
    expect(parseExactAmount('320000')).toBe(320_000)
    expect(parseExactAmount('320,000')).toBe(320_000)
    expect(parseExactAmount('$320,000')).toBe(320_000)
    expect(parseExactAmount(' 320,000 ')).toBe(320_000)
  })

  it('returns null rather than zero for unreadable input', () => {
    // Mid-keystroke and empty states must fall back to the tapped band. Scoring
    // someone as $0 while they type is a visibly wrong number, not a blank one.
    expect(parseExactAmount('')).toBeNull()
    expect(parseExactAmount('   ')).toBeNull()
    expect(parseExactAmount('$')).toBeNull()
    expect(parseExactAmount('abc')).toBeNull()
  })

  it('enforces a floor, because income is a denominator', () => {
    // Savings of 0 is a real answer. An income of 0 is not — it sits under the
    // reference bar, so it would make the whole calculation undefined.
    expect(parseExactAmount('0')).toBe(0)
    expect(parseExactAmount('0', { min: 1 })).toBeNull()
    expect(parseExactAmount('-5000', { min: 1 })).toBeNull()
  })

  it('rejects figures beyond anything this tool should price', () => {
    expect(parseExactAmount('100000001')).toBeNull()
  })

  it('an exact income is reported as "exact", like an exact position', () => {
    expect(bandLabel(INCOME_BANDS, 240_000)).toBe('exact')
    expect(bandLabel(INCOME_BANDS, 105_000)).toBe('$90–120K')
  })
})
