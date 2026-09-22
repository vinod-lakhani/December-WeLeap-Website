import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { DATA_RETENTION, RETENTION_DAYS } from './data-retention'

/**
 * The support page and the privacy policy must say the same thing.
 *
 * /support is now the Google Play Data deletion URL as well as the App Store
 * support URL, so it states retention periods itself rather than linking to
 * them. That creates a second place those periods are written down, and two
 * copies of a legal commitment drift — quietly, and in the direction nobody
 * notices until somebody asks which one is true.
 *
 * The policy is the source. It carries an effective date and is the document
 * a regulator or a reviewer would hold us to; lib/data-retention.ts exists to
 * render it, not to restate it. These tests fail the build if they part ways.
 */
const policy = readFileSync(join(process.cwd(), 'app/privacy-policy/page.tsx'), 'utf8')

describe('retention periods, against the privacy policy', () => {
  it('matches the policy on active systems', () => {
    expect(RETENTION_DAYS.activeSystems).toBe(30)
    expect(policy).toMatch(
      new RegExp(`active systems within ${RETENTION_DAYS.activeSystems} days`),
    )
  })

  it('matches the policy on backups', () => {
    expect(RETENTION_DAYS.backups).toBe(90)
    expect(policy).toMatch(new RegExp(`up to ${RETENTION_DAYS.backups} days after deletion`))
  })

  it('states the same periods in the table the page renders', () => {
    const byWhat = (needle: string) =>
      DATA_RETENTION.find((r) => r.what.toLowerCase().includes(needle))!
    expect(byWhat('active systems').period).toContain(String(RETENTION_DAYS.activeSystems))
    expect(byWhat('backups').period).toContain(String(RETENTION_DAYS.backups))
  })

  it('keeps every commitment the policy makes, none dropped in the retelling', () => {
    /**
     * A table that quietly omits a retention category reads as a shorter
     * promise than the policy makes, which is the failure mode that matters
     * here — not a wrong number, a missing row.
     */
    const required = ['active systems', 'backups', 'bank connections', 'law requires', 'opt-out', 'anonymised']
    const covered = DATA_RETENTION.map((r) => `${r.what} ${r.period}`.toLowerCase()).join(' | ')
    expect(required.filter((n) => !covered.includes(n))).toEqual([])
  })

  it('gives a reason for every period, because Google asks for one', () => {
    for (const row of DATA_RETENTION) {
      expect(row.why.length, row.what).toBeGreaterThan(30)
      expect(row.period.length, row.what).toBeGreaterThan(0)
    }
  })
})

describe('what the Play Console needs from this URL', () => {
  const support = readFileSync(join(process.cwd(), 'app/support/page.tsx'), 'utf8')

  it('states retention on the page rather than linking it away', () => {
    // The gap that would have failed review: the page used to answer "how long
    // anything is kept afterwards" with a link to the privacy policy.
    expect(support).toMatch(/DATA_RETENTION\.map/)
    expect(support).not.toMatch(/How long anything is\s+kept afterwards is set out in our/)
  })

  it('still offers a route for someone who no longer has the app', () => {
    // The whole point of the URL: deletion without installing anything.
    expect(support).toMatch(/lost access to the app/)
    expect(support).toMatch(/mailto:\$\{SUPPORT_EMAIL\}/)
  })
})
