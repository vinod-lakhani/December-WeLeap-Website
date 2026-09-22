/**
 * What survives account deletion, for how long, and why.
 *
 * Google Play requires the URL entered under App content → Data deletion to be
 * reachable without installing the app and to say how somebody requests
 * deletion AND what happens to their data afterwards. /support already did the
 * first two things: it leads with a contact address, and it names the
 * self-serve controls. What it did not do was state retention — it linked to
 * the privacy policy for "how long anything is kept afterwards", and a page
 * that delegates the answer is a weaker match for a field literally called
 * Data deletion than one that gives it.
 *
 * These facts are not new. They are the "How Long We Keep Your Information"
 * section of the privacy policy, moved somewhere both pages can read, because
 * a support page restating retention periods from memory is a page that will
 * eventually contradict the policy — and of all the things on this site to
 * have two versions of, a commitment about deleting someone's financial data
 * is the worst one.
 *
 * data-retention.test.ts reads the privacy policy and fails the build if the
 * two ever disagree. If a period changes it changes in the policy, which
 * carries an effective date, and then here.
 *
 * The "why" is not decoration: Google asks for a reason alongside the period,
 * and a retention entry without one reads as a company keeping data because it
 * would rather not delete it.
 */

export interface RetentionRow {
  what: string
  period: string
  why: string
}

export const DATA_RETENTION: readonly RetentionRow[] = [
  {
    what: 'Personal information in our active systems',
    period: 'Removed within 30 days',
    why: 'Deletion runs on a cycle rather than instantly, so we state the window rather than promise it is immediate.',
  },
  {
    what: 'Encrypted backups',
    period: 'Up to 90 days',
    why: 'Residual copies persist until they are overwritten on the normal backup cycle. We never restore a deleted account from them.',
  },
  {
    what: 'Bank connections',
    period: 'Revoked immediately',
    why: 'Access tokens are revoked the moment you disconnect an account or close your account, so we stop receiving data straight away.',
  },
  {
    what: 'Records we are required to keep',
    period: 'As long as the law requires',
    why: 'To meet legal obligations, resolve disputes, prevent fraud and abuse, and enforce our agreements. We keep only what is necessary for that.',
  },
  {
    what: 'Your opt-out from email or SMS',
    period: 'Kept indefinitely',
    why: 'This minimal record is what lets us honour the opt-out. Deleting it would risk contacting you again.',
  },
  {
    what: 'Anonymised and aggregated data',
    period: 'Kept indefinitely',
    why: 'Once information can no longer be linked to you or your device it is not personal information, and the periods above do not apply.',
  },
]

/** The two numeric periods the drift test checks against the policy's prose. */
export const RETENTION_DAYS = { activeSystems: 30, backups: 90 } as const
