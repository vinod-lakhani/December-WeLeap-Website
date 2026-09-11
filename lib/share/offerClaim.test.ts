import { describe, expect, it } from 'vitest'

import {
  buildOfferClaim,
  buildOfferCompareClaim,
  decodeOfferClaim,
  encodeOfferClaim,
  offerClaimFootnote,
  offerClaimHeadline,
  offerClaimSupporting,
  type OfferClaim,
} from './offerClaim'

/**
 * A claim travels as a URL path segment written by one visitor and read by
 * anybody they send it to, so the decoder is the boundary: it has to reject
 * anything the encoder would not have produced, and a round trip has to be
 * exact. None of this had a test before the comparison claims arrived.
 */

const ALL: OfferClaim[] = [
  { kind: 'method' },
  { kind: 'uplift', pct: 23 },
  { kind: 'uplift', pct: 23, components: 5 },
  { kind: 'compare_method' },
  { kind: 'compare_split', pkgPct: 24, monthPct: 13 },
  { kind: 'compare_agree', pkgPct: 24, monthPct: 13 },
]

describe('the claim codec', () => {
  it.each(ALL)('round-trips $kind exactly', (claim) => {
    expect(decodeOfferClaim(encodeOfferClaim(claim))).toEqual(claim)
  })

  it('gives each kind its own slug', () => {
    const slugs = ALL.map(encodeOfferClaim)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('keeps the comparison slugs clear of the uplift pattern', () => {
    expect(encodeOfferClaim({ kind: 'compare_split', pkgPct: 24, monthPct: 13 })).toBe('split-24-13')
    expect(encodeOfferClaim({ kind: 'compare_agree', pkgPct: 24, monthPct: 13 })).toBe('both-24-13')
    expect(decodeOfferClaim('split-24-13')!.kind).toBe('compare_split')
    expect(decodeOfferClaim('both-24-13')!.kind).toBe('compare_agree')
  })

  it.each([
    ['', 'empty'],
    ['split-24', 'a comparison missing half its numbers'],
    ['split-24-13-9', 'a third number nothing would produce'],
    ['split-0-13', 'a zero percent difference'],
    ['split-1000-13', 'a percentage past the range'],
    ['both--13', 'a missing first number'],
    ['splitting-24-13', 'a near miss on the prefix'],
    ['xsplit-24-13', 'a prefix that is not anchored'],
    ['uplift-24-13', 'an uplift shaped like a comparison'],
    ['../../etc/passwd', 'a traversal attempt'],
  ])('rejects %s (%s)', (slug) => {
    expect(decodeOfferClaim(slug)).toBeNull()
  })

  it('rejects anything long enough to be an attack rather than a claim', () => {
    expect(decodeOfferClaim(`split-24-13${'0'.repeat(80)}`)).toBeNull()
  })
})

describe('buildOfferCompareClaim', () => {
  it('names the split when the bigger package leaves less', () => {
    // The Austin/San Francisco case: B pays more, A lives better.
    const claim = buildOfferCompareClaim({
      totalA: 98_600, totalB: 121_800, leftA: 3_453, leftB: 3_005,
    })

    expect(claim.kind).toBe('compare_split')
    if (claim.kind !== 'compare_split') throw new Error('narrowing')
    expect(claim.pkgPct).toBe(24)
    expect(claim.monthPct).toBe(15)
    expect(offerClaimHeadline(claim)).toBe(
      'One offer paid 24% more. It left me 15% less every month.',
    )
  })

  it('reads the same whichever column the bigger offer is in', () => {
    const ab = buildOfferCompareClaim({ totalA: 98_600, totalB: 121_800, leftA: 3_453, leftB: 3_005 })
    const ba = buildOfferCompareClaim({ totalA: 121_800, totalB: 98_600, leftA: 3_005, leftB: 3_453 })
    expect(ab).toEqual(ba)
  })

  it('says so plainly when the two agree', () => {
    const claim = buildOfferCompareClaim({
      totalA: 98_600, totalB: 121_800, leftA: 3_000, leftB: 3_600,
    })

    expect(claim.kind).toBe('compare_agree')
    expect(offerClaimHeadline(claim)).toContain('also left me')
  })

  it('withholds the numbers when an offer leaves nothing after rent', () => {
    // No denominator, and no claim worth making out of one.
    expect(
      buildOfferCompareClaim({ totalA: 98_600, totalB: 121_800, leftA: 3_453, leftB: -200 }).kind,
    ).toBe('compare_method')
    expect(
      buildOfferCompareClaim({ totalA: 98_600, totalB: 121_800, leftA: 0, leftB: 3_005 }).kind,
    ).toBe('compare_method')
  })

  it('withholds them when a difference rounds away to nothing', () => {
    // Two offers $40 and $2 apart are the same offer twice.
    expect(
      buildOfferCompareClaim({ totalA: 100_000, totalB: 100_040, leftA: 3_000, leftB: 3_002 }).kind,
    ).toBe('compare_method')
  })

  it('never puts a dollar figure in the claim', () => {
    /**
     * The rule the whole file exists to keep: salary is exactly the number an
     * offer post cannot contain, and a comparison carries two of them.
     */
    const claim = buildOfferCompareClaim({
      totalA: 98_600, totalB: 121_800, leftA: 3_453, leftB: 3_005,
    })

    const printed = [
      encodeOfferClaim(claim),
      offerClaimHeadline(claim),
      offerClaimFootnote(claim),
      offerClaimSupporting(claim),
    ].join(' ')

    expect(printed).not.toMatch(/\$/)
    expect(printed).not.toContain('98')
    expect(printed).not.toContain('121')
    expect(printed).not.toContain('3,453')
  })
})

describe('the copy', () => {
  it.each(ALL)('gives $kind a headline, footnote and supporting line', (claim) => {
    for (const line of [
      offerClaimHeadline(claim),
      offerClaimFootnote(claim),
      offerClaimSupporting(claim),
    ]) {
      expect(line.length).toBeGreaterThan(20)
      expect(line).not.toContain('undefined')
      expect(line).not.toContain('NaN')
    }
  })

  it('explains a comparison differently from a single offer', () => {
    const single = offerClaimSupporting({ kind: 'uplift', pct: 23 })
    const compared = offerClaimSupporting({ kind: 'compare_split', pkgPct: 24, monthPct: 13 })

    // One offer's supporting line itemises what base salary leaves out. A
    // comparison's has to explain something else entirely — why two offers
    // swapped places — so it talks about state tax and city rent instead.
    expect(single).toContain('Base salary')
    expect(single).not.toContain('rent')

    expect(compared).toContain('rent')
    expect(compared).toContain('state')
    expect(compared).not.toBe(single)
  })
})

describe('buildOfferClaim', () => {
  it('still falls back to the method claim on a package that beats nothing', () => {
    expect(buildOfferClaim({ totalPackage: 80_000, base: 100_000 }).kind).toBe('method')
    expect(buildOfferClaim({ totalPackage: 100_000, base: 0 }).kind).toBe('method')
  })
})
