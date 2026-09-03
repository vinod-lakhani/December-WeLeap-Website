/**
 * Campaign link builder — one place that produces correctly-shaped links.
 *
 * This exists because UTM values are free text that nobody validates, and the
 * damage is silent. `Joshua` and `joshua` are two rows in PostHog. So are
 * `joshua ` and `joshua`, and `Fall Recruiting` becomes `Fall%20Recruiting`.
 * A partner who types their own link once a week will eventually produce all
 * four, and the split only becomes visible when someone tries to total a
 * column that no longer adds up.
 *
 * The convention, which the whole scheme depends on staying stable:
 *
 *   utm_source    who is sending      joshua, ambassador
 *   utm_medium    the mechanism       referral, campus, social
 *   utm_campaign  effort + month      network_sep26
 *   utm_content   variant or person   maya_nyu, whatsapp
 *
 * Keeping the PROGRAM in `utm_source` and the PERSON in `utm_content` is what
 * lets every ambassador stay individually measurable while the program still
 * rolls up under one source — and adding ambassador twelve is a new content
 * value rather than a new scheme.
 */

import { FREE_TOOLS } from '@/lib/tools'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://weleap.app'

export interface Destination {
  label: string
  url: string
  /** Shown under the picker — why you would send someone here. */
  hint: string
}

/**
 * Where a link can point.
 *
 * The app comes first because warm invites do not need a tool as a door: a
 * person who already trusts the sender is being asked to sign up, not to be
 * convinced. Cold traffic gets a tool, which is the whole reason the tools
 * exist.
 *
 * Tool destinations are derived from FREE_TOOLS, so a new tool is selectable
 * the day it ships and a renamed route cannot leave a dead link in an
 * ambassador's bio.
 */
export function destinations(): Destination[] {
  return [
    {
      label: 'The app (sign-up)',
      url: APP_URL,
      hint: 'Warm invites who already trust you. No tool needed as a door.',
    },
    ...FREE_TOOLS.map((t) => ({
      label: t.name,
      url: `${SITE_URL}${t.href}`,
      hint: t.question,
    })),
  ]
}

/** Who is sending. Free text is allowed; these are the ones already in use. */
export const SOURCES = ['joshua', 'ambassador', 'founder', 'newsletter', 'partner'] as const

/** The mechanism. */
export const MEDIUMS = ['referral', 'campus', 'social', 'dm', 'email', 'podcast', 'event'] as const

/** The effort half of a campaign name; the month is appended automatically. */
export const EFFORTS = ['network', 'fall_recruiting', 'launch', 'content', 'partnership'] as const

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * `sep26` — the month suffix that makes two runs of the same effort comparable.
 *
 * Takes a date rather than reading the clock so it can be tested, and so a
 * link made on the 31st for next month's push can say so.
 */
export function monthCode(date: Date): string {
  return `${MONTHS[date.getMonth()]}${String(date.getFullYear()).slice(-2)}`
}

export interface Normalized {
  value: string
  /** True when cleaning changed what was typed — surfaced, not silent. */
  changed: boolean
}

/**
 * Make a UTM value safe to group on.
 *
 * Lowercased because analytics tools do not fold case, so `Joshua` and
 * `joshua` are two different partners as far as a funnel is concerned.
 * Spaces and punctuation become underscores rather than being percent-encoded,
 * because an encoded space is unreadable in a report and impossible to type
 * back correctly.
 */
export function normalizeUtmValue(raw: string): Normalized {
  const value = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
  return { value, changed: value !== raw.trim() }
}

export interface LinkInput {
  destinationUrl: string
  source: string
  medium: string
  campaign: string
  content?: string
  term?: string
}

export interface BuiltLink {
  url: string
  /** Blocking problems — the link is not usable until these are cleared. */
  errors: string[]
  /** Non-blocking, but worth reading before sending it to fifty people. */
  warnings: string[]
}

/**
 * Build the link, and say what is wrong with it.
 *
 * Returns errors rather than throwing or silently emitting a broken URL: this
 * is used by people who are not going to read a console, and a link missing
 * `utm_source` looks completely normal right up until the month it needs to be
 * counted.
 */
export function buildLink(input: LinkInput, now: Date): BuiltLink {
  const errors: string[] = []
  const warnings: string[] = []

  const source = normalizeUtmValue(input.source)
  const medium = normalizeUtmValue(input.medium)
  const campaign = normalizeUtmValue(input.campaign)
  const content = input.content ? normalizeUtmValue(input.content) : null
  const term = input.term ? normalizeUtmValue(input.term) : null

  for (const [name, n] of [
    ['Source', source],
    ['Medium', medium],
    ['Campaign', campaign],
    ['Content', content],
    ['Term', term],
  ] as const) {
    if (n?.changed) warnings.push(`${name} was cleaned up to "${n.value}" — lowercase, no spaces.`)
  }

  if (!source.value) errors.push('Source is required — it is who the link is credited to.')
  if (!medium.value) errors.push('Medium is required — it is how the link is being sent.')
  if (!campaign.value) errors.push('Campaign is required — it is what groups this effort together.')

  /**
   * A campaign with no month cannot be compared against the next run of the
   * same effort, which is usually the only question anyone asks of it later.
   */
  if (campaign.value && !/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\d{2}$/.test(campaign.value)) {
    warnings.push(
      `Campaign has no month on the end. "${campaign.value}_${monthCode(now)}" would let you compare this run against the next one.`
    )
  }

  if (source.value === 'ambassador' && !content?.value) {
    warnings.push(
      'Ambassador links usually put the person in Content (e.g. maya_nyu), so each one stays individually measurable.'
    )
  }

  if (!input.destinationUrl) errors.push('Pick a destination.')

  const params = new URLSearchParams()
  if (source.value) params.set('utm_source', source.value)
  if (medium.value) params.set('utm_medium', medium.value)
  if (campaign.value) params.set('utm_campaign', campaign.value)
  if (content?.value) params.set('utm_content', content.value)
  if (term?.value) params.set('utm_term', term.value)

  const qs = params.toString()
  const base = input.destinationUrl
  const url = qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base

  return { url, errors, warnings }
}

export interface Preset {
  id: string
  label: string
  description: string
  /** Applied over the current form. `campaign` gets the month appended. */
  apply: (now: Date) => LinkInput
}

/**
 * The two links already in use, as one click each.
 *
 * Presets rather than documentation because the failure mode here is someone
 * retyping a scheme from memory a month later and getting one field wrong.
 */
export function presets(): Preset[] {
  return [
    {
      id: 'joshua_network',
      label: "Joshua's network",
      description:
        'Straight to the app — these are warm invites. This link is how signups get counted, so it should be used without exception.',
      apply: (now) => ({
        destinationUrl: APP_URL,
        source: 'joshua',
        medium: 'referral',
        campaign: `network_${monthCode(now)}`,
        content: '',
      }),
    },
    {
      id: 'campus_ambassador',
      label: 'Campus ambassador',
      description:
        'Offer Letter Analyzer, which fits recruiting season. Put the ambassador in Content as firstname_school.',
      apply: (now) => ({
        destinationUrl: `${SITE_URL}/what-is-my-job-offer-worth`,
        source: 'ambassador',
        medium: 'campus',
        campaign: `fall_recruiting_${monthCode(now)}`,
        content: '',
      }),
    },
  ]
}
