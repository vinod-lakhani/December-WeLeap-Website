/**
 * The failure this guards against is silent: a UTM value that differs only by
 * case or whitespace splits into two rows in analytics, and nobody notices
 * until a column that should total the campaign no longer adds up.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeUtmValue,
  monthCode,
  buildLink,
  presets,
  destinations,
  APP_URL,
} from './link-builder'

const SEP26 = new Date(2026, 8, 3)

describe('normalizeUtmValue', () => {
  it('folds case, because analytics does not', () => {
    // "Joshua" and "joshua" are two different partners in a funnel.
    expect(normalizeUtmValue('Joshua').value).toBe('joshua')
    expect(normalizeUtmValue('Fall Recruiting').value).toBe('fall_recruiting')
  })

  it('turns spaces and punctuation into underscores rather than percent-encoding', () => {
    // %20 in a report is unreadable and impossible to retype correctly.
    expect(normalizeUtmValue('maya nyu').value).toBe('maya_nyu')
    expect(normalizeUtmValue('maya@nyu.edu').value).toBe('maya_nyu_edu')
    expect(normalizeUtmValue('  network  sep26  ').value).toBe('network_sep26')
  })

  it('collapses and trims separators so two near-identical entries converge', () => {
    expect(normalizeUtmValue('a__b').value).toBe('a_b')
    expect(normalizeUtmValue('_joshua_').value).toBe('joshua')
  })

  it('reports whether it changed anything, so the change is visible', () => {
    expect(normalizeUtmValue('joshua').changed).toBe(false)
    expect(normalizeUtmValue('Joshua').changed).toBe(true)
  })
})

describe('monthCode', () => {
  it('is the suffix that makes two runs of one effort comparable', () => {
    expect(monthCode(SEP26)).toBe('sep26')
    expect(monthCode(new Date(2026, 0, 15))).toBe('jan26')
    expect(monthCode(new Date(2027, 11, 1))).toBe('dec27')
  })
})

describe('buildLink', () => {
  const base = {
    destinationUrl: APP_URL,
    source: 'joshua',
    medium: 'referral',
    campaign: 'network_sep26',
  }

  it('reproduces the link format already in use', () => {
    const { url, errors } = buildLink(base, SEP26)
    expect(errors).toEqual([])
    expect(url).toBe(
      'https://weleap.app?utm_source=joshua&utm_medium=referral&utm_campaign=network_sep26'
    )
  })

  it('keeps UTM key order stable, so two links for one campaign look identical', () => {
    const a = buildLink({ ...base, content: 'whatsapp' }, SEP26).url
    const b = buildLink({ ...base, content: 'whatsapp' }, SEP26).url
    expect(a).toBe(b)
    expect(a).toContain('utm_campaign=network_sep26&utm_content=whatsapp')
  })

  it('blocks a link that cannot be attributed', () => {
    const { errors } = buildLink({ ...base, source: '' }, SEP26)
    expect(errors.some((e) => /Source is required/.test(e))).toBe(true)
  })

  it('warns when a campaign has no month, rather than silently allowing it', () => {
    const { warnings, errors } = buildLink({ ...base, campaign: 'network' }, SEP26)
    expect(errors).toEqual([])
    expect(warnings.some((w) => w.includes('network_sep26'))).toBe(true)
  })

  it('warns an ambassador link with no person in it', () => {
    // The whole scheme depends on the person living in utm_content; without it
    // every ambassador collapses into one indistinguishable row.
    const { warnings } = buildLink({ ...base, source: 'ambassador', medium: 'campus' }, SEP26)
    expect(warnings.some((w) => /individually measurable/.test(w))).toBe(true)
  })

  it('surfaces the cleanup instead of quietly changing what was typed', () => {
    const { url, warnings } = buildLink({ ...base, source: 'Joshua' }, SEP26)
    expect(url).toContain('utm_source=joshua')
    expect(warnings.some((w) => /cleaned up to "joshua"/.test(w))).toBe(true)
  })

  it('appends with & when the destination already has a query string', () => {
    const { url } = buildLink({ ...base, destinationUrl: 'https://weleap.ai/x?a=1' }, SEP26)
    expect(url).toBe(
      'https://weleap.ai/x?a=1&utm_source=joshua&utm_medium=referral&utm_campaign=network_sep26'
    )
  })
})

describe('presets', () => {
  it("Joshua's network matches the agreed format, with the current month", () => {
    const p = presets().find((x) => x.id === 'joshua_network')!
    const { url, errors, warnings } = buildLink(p.apply(SEP26), SEP26)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
    expect(url).toBe(
      'https://weleap.app?utm_source=joshua&utm_medium=referral&utm_campaign=network_sep26'
    )
  })

  it('campus ambassador matches its format and points at a real tool route', () => {
    const p = presets().find((x) => x.id === 'campus_ambassador')!
    const input = p.apply(SEP26)
    const { url } = buildLink({ ...input, content: 'maya_nyu' }, SEP26)
    expect(url).toContain('/what-is-my-job-offer-worth?')
    expect(url).toContain('utm_source=ambassador&utm_medium=campus')
    expect(url).toContain('utm_campaign=fall_recruiting_sep26')
    expect(url).toContain('utm_content=maya_nyu')
    // The preset's route has to exist, or ambassadors paste a 404 into a bio.
    expect(destinations().some((d) => d.url === input.destinationUrl)).toBe(true)
  })
})

describe('destinations', () => {
  it('offers the app first, then every live tool', () => {
    const d = destinations()
    expect(d[0]!.url).toBe(APP_URL)
    expect(d.length).toBeGreaterThan(1)
    // Derived from FREE_TOOLS, so a renamed route cannot go stale here.
    expect(d.some((x) => x.label === 'Money Age')).toBe(true)
  })
})
