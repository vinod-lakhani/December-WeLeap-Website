/**
 * What we read off an internship offer letter, and nothing else.
 *
 * Same privacy model as fields.ts, kept deliberately: every field is a bounded
 * number, a US state code, or a value from a closed list. There is no slot a
 * name, an address or an ID number can be put in, so none can come back.
 *
 * Two shapes needed some thought to stay inside that rule.
 *
 * DATES as YYYYMMDD integers. The thing worth reading off an internship letter
 * that a person most often gets wrong is the length of the term — the Purdue
 * tester's idea was exactly this: "it finds the start and end dates and
 * calculates the number of weeks". A date string would be free text; an eight-
 * digit integer bounded to 2020-2035 cannot carry anything else, and is still
 * one digit short of a Social Security number. The weeks are worked out HERE,
 * from the two dates, not by the model — arithmetic is the part a model is
 * least reliable at and a function is most reliable at.
 *
 * PERKS as a closed list. The same tester asked for a "did we miss anything?"
 * after an upload — a wellness gift card, meals — so the reader learns what the
 * letter offers that the numbers do not price. Free text would be the obvious
 * way and would reopen the hole the schema exists to close, so the model picks
 * from categories. A perk outside the list is "other cash benefit", which still
 * tells the visitor to look.
 */

import { US_STATES } from '@/lib/states'
import { MIN_CONFIDENCE, OFFER_FIELDS, isStateCode, type ParsedField } from './fields'
import { containsPii } from './redact'

interface FieldSpec {
  describe: string
  min: number
  max: number
  integer?: boolean
}

const DATE_RANGE = { min: 20200101, max: 20351231, integer: true } as const

export const INTERNSHIP_FIELDS = {
  hourlyRate: {
    describe: 'Hourly pay rate in US dollars, if the internship is paid by the hour.',
    min: 7,
    max: 250,
  },
  hoursPerWeek: {
    describe: 'Expected hours per week, if stated. Omit if the letter does not state a number of hours.',
    min: 1,
    max: 80,
    integer: true,
  },
  monthlyStipend: {
    describe: 'Pay stated as a monthly stipend or monthly salary, in US dollars. Not a housing stipend.',
    min: 100,
    max: 40_000,
  },
  termLumpSum: {
    describe: 'Pay stated as one total for the whole internship, in US dollars. Not a housing or relocation amount.',
    min: 500,
    max: 250_000,
  },
  termWeeks: {
    describe: 'The length of the internship in weeks, ONLY if the letter states it as a length ("a 12-week internship"). If it gives dates instead, omit this and return the dates.',
    min: 1,
    max: 52,
    integer: true,
  },
  startDateYmd: {
    describe: 'The start date as an eight-digit number YYYYMMDD, e.g. June 1 2027 is 20270601. Only if the letter states a full date.',
    ...DATE_RANGE,
  },
  endDateYmd: {
    describe: 'The end date as an eight-digit number YYYYMMDD, e.g. August 20 2027 is 20270820. Only if the letter states a full date.',
    ...DATE_RANGE,
  },
  housingStipendMonthly: {
    describe: 'A housing stipend or allowance paid per month, in US dollars.',
    min: 0,
    max: 20_000,
  },
  housingLumpSum: {
    describe: 'A housing stipend or allowance paid once for the whole term, in US dollars. Not a monthly amount.',
    min: 0,
    max: 60_000,
  },
  relocationAllowance: {
    describe: 'A one-time relocation, moving or travel allowance, in US dollars. Not a housing stipend.',
    min: 0,
    max: 60_000,
  },
  housingProvided: {
    describe: 'Set to 1 if the employer provides housing itself (corporate housing, an apartment or a dorm) at no cost to the intern. Omit otherwise.',
    min: 1,
    max: 1,
    integer: true,
  },
  matchRatePct: { ...OFFER_FIELDS.matchRatePct },
  matchUpToPct: { ...OFFER_FIELDS.matchUpToPct },
} as const satisfies Record<string, FieldSpec>

export type InternshipFieldKey = keyof typeof INTERNSHIP_FIELDS
export const INTERNSHIP_FIELD_KEYS = Object.keys(INTERNSHIP_FIELDS) as InternshipFieldKey[]

/** Perks the numbers do not price, for the "also in your letter" line. */
export const INTERNSHIP_PERKS = {
  wellness: 'a wellness or fitness stipend',
  meals: 'meals or a food allowance',
  transit: 'a transit or commuting benefit',
  equipment: 'equipment or a home-office allowance',
  tuition: 'tuition or education support',
  signing_bonus: 'a signing bonus',
  return_offer: 'a return-offer or completion bonus',
  travel_home: 'travel home during the term',
  other_cash: 'another cash benefit',
} as const

export type InternshipPerk = keyof typeof INTERNSHIP_PERKS
const PERK_KEYS = Object.keys(INTERNSHIP_PERKS) as InternshipPerk[]

export type ParsedInternship = Partial<Record<InternshipFieldKey, ParsedField>> & {
  workStateCode?: { value: (typeof US_STATES)[number]; confidence: number; quote: string }
  otherPerks?: Array<{ kind: InternshipPerk; quote: string }>
}

export const INTERNSHIP_PERKS_DESCRIPTION =
  'Benefits in the letter that are not pay, housing, relocation or a 401(k): one entry per benefit, each with a verbatim quote. Omit if there are none.'

export function isInternshipInRange(key: InternshipFieldKey, value: unknown): value is number {
  const spec: FieldSpec = INTERNSHIP_FIELDS[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (spec.integer && !Number.isInteger(value)) return false
  return value >= spec.min && value <= spec.max
}

/** A YYYYMMDD integer as a UTC date, or null if it is not a real calendar date. */
export function ymdToDate(ymd: number): Date | null {
  if (!Number.isInteger(ymd)) return null
  const y = Math.floor(ymd / 10_000)
  const m = Math.floor((ymd % 10_000) / 100)
  const d = ymd % 100
  const date = new Date(Date.UTC(y, m - 1, d))
  // Rejects 20270231 and friends, which Date would otherwise roll into March.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date
}

/**
 * Weeks in a term, from its first and last day, inclusive.
 *
 * Monday June 1 to Friday August 21 is twelve working weeks; the span is 82
 * days counting both ends, 11.7 calendar weeks, which rounds to 12. Rounding
 * the inclusive span is what makes a Monday-to-Friday term come out as the
 * number on the letter. Null for an end before the start or a span outside
 * one to fifty-two weeks — a misread, not a term.
 */
export function weeksBetween(startYmd: number, endYmd: number): number | null {
  const start = ymdToDate(startYmd)
  const end = ymdToDate(endYmd)
  if (!start || !end || end <= start) return null
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const weeks = Math.round(days / 7)
  return weeks >= 1 && weeks <= 52 ? weeks : null
}

/**
 * The precision gate, same rule as validateExtraction: a field that fails any
 * check is dropped, never repaired.
 */
export function validateInternship(raw: unknown): { parsed: ParsedInternship; rejected: string[] } {
  const parsed: ParsedInternship = {}
  const rejected: string[] = []
  if (typeof raw !== 'object' || raw === null) return { parsed, rejected }
  const input = raw as Record<string, unknown>

  const meta = (key: string, entry: { confidence?: unknown; quote?: unknown }, valueOk: boolean) => {
    const confidence = typeof entry?.confidence === 'number' ? entry.confidence : 0
    const quote = typeof entry?.quote === 'string' ? entry.quote.trim() : ''
    if (!valueOk || confidence < MIN_CONFIDENCE || quote.length === 0 || containsPii(quote)) {
      rejected.push(key)
      return null
    }
    return { confidence, quote }
  }

  for (const key of INTERNSHIP_FIELD_KEYS) {
    const entry = input[key] as { value?: unknown; confidence?: unknown; quote?: unknown } | undefined
    if (!entry || typeof entry !== 'object') continue
    const ok =
      isInternshipInRange(key, entry.value) &&
      // A date has to be a real one, not just eight digits in range.
      (key !== 'startDateYmd' && key !== 'endDateYmd' ? true : ymdToDate(entry.value as number) !== null)
    const m = meta(key, entry, ok)
    if (m) parsed[key] = { value: entry.value as number, ...m }
  }

  // Two dates that make no term are a misread of one of them; keep neither.
  if (parsed.startDateYmd && parsed.endDateYmd && weeksBetween(parsed.startDateYmd.value, parsed.endDateYmd.value) === null) {
    delete parsed.startDateYmd
    delete parsed.endDateYmd
    rejected.push('startDateYmd', 'endDateYmd')
  }

  const state = input.workStateCode as { value?: unknown; confidence?: unknown; quote?: unknown } | undefined
  if (state && typeof state === 'object') {
    const m = meta('workStateCode', state, isStateCode(state.value))
    if (m) parsed.workStateCode = { value: state.value as (typeof US_STATES)[number], ...m }
  }

  if (Array.isArray(input.otherPerks)) {
    const seen = new Set<InternshipPerk>()
    const perks: Array<{ kind: InternshipPerk; quote: string }> = []
    for (const p of input.otherPerks as Array<{ kind?: unknown; quote?: unknown }>) {
      const kind = p?.kind as InternshipPerk
      const quote = typeof p?.quote === 'string' ? p.quote.trim() : ''
      if (!PERK_KEYS.includes(kind) || quote.length === 0 || containsPii(quote) || seen.has(kind)) {
        rejected.push('otherPerks')
        continue
      }
      seen.add(kind)
      perks.push({ kind, quote })
    }
    if (perks.length > 0) parsed.otherPerks = perks
  }

  return { parsed, rejected }
}

/**
 * Fold several tool-call blocks into one. Fields: highest confidence wins, as
 * in mergeToolInputs. Perks: concatenated, because two blocks can each list
 * different ones and keeping only the first would drop real benefits.
 */
export function mergeInternshipInputs(inputs: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  const perks: unknown[] = []
  for (const input of inputs) {
    if (typeof input !== 'object' || input === null) continue
    for (const [key, entry] of Object.entries(input as Record<string, unknown>)) {
      if (key === 'otherPerks') {
        if (Array.isArray(entry)) perks.push(...entry)
        continue
      }
      if (typeof entry !== 'object' || entry === null) continue
      const existing = merged[key] as { confidence?: unknown } | undefined
      const conf = (entry as { confidence?: unknown }).confidence
      if (!existing || (typeof conf === 'number' && (typeof existing.confidence !== 'number' || conf > existing.confidence))) {
        merged[key] = entry
      }
    }
  }
  if (perks.length > 0) merged.otherPerks = perks
  return merged
}

/** The term in weeks: stated length first, then the dates, else null. */
export function internshipWeeks(parsed: ParsedInternship): number | null {
  if (parsed.termWeeks) return parsed.termWeeks.value
  if (parsed.startDateYmd && parsed.endDateYmd) return weeksBetween(parsed.startDateYmd.value, parsed.endDateYmd.value)
  return null
}
