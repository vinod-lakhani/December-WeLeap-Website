import { describe, it, expect } from 'vitest'
import {
  slugifyMetro,
  encodeRentClaim,
  decodeRentClaim,
  rentClaimHeadline,
  buildRentClaim,
  type RentClaim,
} from './rentClaim'

describe('slugifyMetro', () => {
  it('drops the comma and lowercases', () => {
    expect(slugifyMetro('Austin, TX')).toBe('austin-tx')
  })

  it('collapses multi-word metros', () => {
    expect(slugifyMetro('San Francisco, CA')).toBe('san-francisco-ca')
    expect(slugifyMetro('Winston-Salem, NC')).toBe('winston-salem-nc')
  })

  it('handles the punctuation that actually appears in the ZORI data', () => {
    expect(slugifyMetro("Coeur d'Alene, ID")).toBe('coeur-d-alene-id')
    expect(slugifyMetro('Sault Ste. Marie, MI')).toBe('sault-ste-marie-mi')
  })

  it('never leaves a leading or trailing separator', () => {
    expect(slugifyMetro('  Austin, TX  ')).toBe('austin-tx')
  })
})

describe('encode/decode round trip', () => {
  const cases: RentClaim[] = [
    { kind: 'market_gap', metroSlug: 'austin-tx', pct: 22, direction: 'over' },
    { kind: 'market_gap', metroSlug: 'san-francisco-ca', pct: 7, direction: 'under' },
    { kind: 'market_gap', metroSlug: 'winston-salem-nc', pct: 100, direction: 'over' },
    { kind: 'method' },
  ]

  it.each(cases)('survives the round trip: %o', (claim) => {
    expect(decodeRentClaim(encodeRentClaim(claim))).toEqual(claim)
  })
})

describe('decodeRentClaim rejects what the tool would never produce', () => {
  it.each([
    ['', 'empty'],
    ['austin-tx', 'no percentage'],
    ['austin-tx-22', 'no direction'],
    ['austin-tx-22-sideways', 'unknown direction'],
    ['austin-tx-0-over', 'a zero gap is not a finding'],
    ['austin-tx-1000-over', 'beyond three digits'],
    ['austin-tx--22-over', 'empty slug segment'],
    ['-austin-tx-22-over', 'leading separator'],
    ['Austin-TX-22-over', 'uppercase'],
    ['austin_tx-22-over', 'underscore'],
    ['austin-tx-22-over/../etc', 'path traversal'],
    ['take-home-not-gross-22-over', 'the method slug is reserved'],
  ])('rejects %s (%s)', (slug) => {
    expect(decodeRentClaim(slug)).toBeNull()
  })

  it('rejects an over-long slug rather than rendering it', () => {
    expect(decodeRentClaim('a'.repeat(200) + '-22-over')).toBeNull()
  })
})

describe('rentClaimHeadline', () => {
  it('states a fact about the city, never about the person', () => {
    const claim: RentClaim = { kind: 'market_gap', metroSlug: 'austin-tx', pct: 22, direction: 'over' }
    const headline = rentClaimHeadline(claim, 'Austin, TX')
    expect(headline).toBe('Rentals in Austin, TX run 22% above what the maths says I can afford.')
    // The whole point of the mechanic: no currency figure can appear.
    expect(headline).not.toMatch(/\$|\d{3,}/)
  })

  it('reads correctly when the market is below the affordable range', () => {
    const claim: RentClaim = { kind: 'market_gap', metroSlug: 'toledo-oh', pct: 15, direction: 'under' }
    expect(rentClaimHeadline(claim, 'Toledo, OH')).toContain('15% below')
  })

  it('falls back to the method line for the method claim', () => {
    expect(rentClaimHeadline({ kind: 'method' }, null)).toBe(
      'I worked out my rent on take-home pay, not gross.'
    )
  })

  it('falls back when the metro cannot be resolved, rather than printing a slug', () => {
    const claim: RentClaim = { kind: 'market_gap', metroSlug: 'nowhere-zz', pct: 22, direction: 'over' }
    expect(rentClaimHeadline(claim, null)).toBe('I worked out my rent on take-home pay, not gross.')
  })
})

describe('buildRentClaim', () => {
  const base = { rentRangeLow: 1400, rentRangeHigh: 1800, regionName: 'Austin, TX' }

  it('measures the gap against the top of the affordable band', () => {
    // 2,196 median against an 1,800 ceiling = 22% over.
    expect(
      buildRentClaim({ ...base, comparison: 'above', medianRent: 2196 })
    ).toEqual({ kind: 'market_gap', metroSlug: 'austin-tx', pct: 22, direction: 'over' })
  })

  it('measures a below-market gap against the bottom of the band', () => {
    // 1,190 median against a 1,400 floor = 15% under.
    expect(
      buildRentClaim({ ...base, comparison: 'below', medianRent: 1190 })
    ).toEqual({ kind: 'market_gap', metroSlug: 'austin-tx', pct: 15, direction: 'under' })
  })

  it('reports no gap when the market sits inside the band', () => {
    expect(buildRentClaim({ ...base, comparison: 'overlap', medianRent: 1600 })).toEqual({
      kind: 'method',
    })
  })

  it.each([
    ['no comparison', { comparison: null, medianRent: 2196 }],
    ['no region', { comparison: 'above' as const, medianRent: 2196, regionName: null }],
    ['no median', { comparison: 'above' as const, medianRent: 0 }],
  ])('falls back to the method claim when %s', (_label, over) => {
    expect(buildRentClaim({ ...base, ...over } as Parameters<typeof buildRentClaim>[0]).kind).toBe(
      'method'
    )
  })

  it('falls back rather than claiming a gap that rounds to zero', () => {
    expect(
      buildRentClaim({ ...base, comparison: 'above', medianRent: 1803 }).kind
    ).toBe('method')
  })

  it('produces a slug that round-trips through the URL', () => {
    const claim = buildRentClaim({
      ...base,
      regionName: "Coeur d'Alene, ID",
      comparison: 'above',
      medianRent: 2196,
    })
    expect(decodeRentClaim(encodeRentClaim(claim))).toEqual(claim)
  })
})
