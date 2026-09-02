import { US_STATES } from '@/lib/states'
import {
  OFFER_FIELD_KEYS,
  MIN_CONFIDENCE,
  MAX_LINE_AMOUNT,
  isInRange,
  isStateCode,
  isPayFrequency,
  isLineKind,
  type OfferFieldKey,
  type ParsedOffer,
  type ParsedPaystub,
} from './fields'
import { containsPii } from './redact'

/**
 * The precision gate.
 *
 * Everything the model returns passes through here, and the rule throughout is
 * that a field which fails any check is DROPPED rather than repaired. The
 * asymmetry is the point: a dropped field leaves the form's existing default in
 * place, which is where the user already was. A repaired one — a salary clamped
 * into range, a quote with the personal data cut out of it — puts a number in
 * front of someone with a provenance they cannot check.
 *
 * `rejected` is returned as names only, for the counter on the response. The
 * values that failed are never logged.
 */

/** Drop anything that fails validation, rather than passing it through. */
export function validateExtraction(raw: unknown): { parsed: ParsedOffer; rejected: string[] } {
  const parsed: ParsedOffer = {}
  const rejected: string[] = []
  if (typeof raw !== 'object' || raw === null) return { parsed, rejected }
  const input = raw as Record<string, { value?: unknown; confidence?: unknown; quote?: unknown }>

  const check = (key: string, entry: (typeof input)[string], valueOk: boolean) => {
    const confidence = typeof entry?.confidence === 'number' ? entry.confidence : 0
    const quote = typeof entry?.quote === 'string' ? entry.quote.trim() : ''
    if (!valueOk || confidence < MIN_CONFIDENCE || quote.length === 0) {
      rejected.push(key)
      return null
    }
    // A quote that still trips the sweep takes its field with it. Showing a
    // value under a quote full of holes asks the user to confirm something they
    // cannot read, which is worse than not offering the field at all.
    if (containsPii(quote)) {
      rejected.push(key)
      return null
    }
    return { confidence, quote }
  }

  for (const key of OFFER_FIELD_KEYS) {
    const entry = input[key]
    if (!entry) continue
    const meta = check(key, entry, isInRange(key, entry.value))
    if (meta) parsed[key as OfferFieldKey] = { value: entry.value as number, ...meta }
  }

  const state = input.workStateCode
  if (state) {
    const meta = check('workStateCode', state, isStateCode(state.value))
    if (meta) parsed.workStateCode = { value: state.value as (typeof US_STATES)[number], ...meta }
  }

  return { parsed, rejected }
}

/**
 * Fold several tool-call payloads into one.
 *
 * Blocks can name the same field twice — `workStateCode` came back in both on
 * the letter this was debugged against. Highest confidence wins, so the merge
 * does not depend on which order the model happened to emit them in.
 */
export function mergeToolInputs(inputs: unknown[]): Record<string, unknown> {
  const merged: Record<string, { confidence?: unknown }> = {}
  for (const input of inputs) {
    if (typeof input !== 'object' || input === null) continue
    for (const [key, entry] of Object.entries(input as Record<string, { confidence?: unknown }>)) {
      if (typeof entry !== 'object' || entry === null) continue
      const existing = merged[key]
      const better =
        !existing ||
        (typeof entry.confidence === 'number' &&
          (typeof existing.confidence !== 'number' || entry.confidence > existing.confidence))
      if (better) merged[key] = entry
    }
  }
  return merged
}

/* ==========================================================================
   Paystub
   ========================================================================== */

/**
 * Same principle, different shape: anything that fails a check is dropped.
 *
 * Dropping a row here is cheaper than dropping a field on the offer path,
 * because the rows we care about are a handful out of fifteen and the rest are
 * only present to keep the listing honest. What must not survive is a row with
 * a nonsense amount or a kind outside the taxonomy, because those feed a
 * deferral percentage the user is then shown as fact.
 */
export function validatePaystub(raw: unknown): { parsed: ParsedPaystub; rejected: string[] } {
  const parsed: ParsedPaystub = { lines: [] }
  const rejected: string[] = []
  if (typeof raw !== 'object' || raw === null) return { parsed, rejected }
  const input = raw as Record<string, unknown>

  if (typeof input.grossPayCurrent === 'number' && Number.isFinite(input.grossPayCurrent)) {
    if (input.grossPayCurrent > 0 && input.grossPayCurrent <= MAX_LINE_AMOUNT) {
      parsed.grossPayCurrent = input.grossPayCurrent
    } else {
      rejected.push('grossPayCurrent')
    }
  }

  if (isPayFrequency(input.payFrequency)) parsed.payFrequency = input.payFrequency
  else if (input.payFrequency !== undefined) rejected.push('payFrequency')

  if (isStateCode(input.workStateCode)) parsed.workStateCode = input.workStateCode
  else if (input.workStateCode !== undefined) rejected.push('workStateCode')

  if (Array.isArray(input.lines)) {
    for (const row of input.lines as unknown[]) {
      if (typeof row !== 'object' || row === null) {
        rejected.push('line')
        continue
      }
      const { label, currentAmount, kind } = row as Record<string, unknown>
      const amountOk =
        typeof currentAmount === 'number' &&
        Number.isFinite(currentAmount) &&
        currentAmount >= 0 &&
        currentAmount <= MAX_LINE_AMOUNT
      const labelOk = typeof label === 'string' && label.trim().length > 0
      // A row label is the closest thing this shape has to a quote, and it goes
      // through the same sweep everything else does — a payroll system that
      // labels a garnishment with a case number should not get it past us.
      if (!amountOk || !labelOk || !isLineKind(kind) || containsPii(label as string)) {
        rejected.push(typeof label === 'string' ? label.slice(0, 40) : 'line')
        continue
      }
      parsed.lines.push({ label: (label as string).trim(), currentAmount: currentAmount as number, kind })
    }
  }

  return { parsed, rejected }
}

/**
 * Fold several paystub tool-call payloads into one.
 *
 * `mergeToolInputs` cannot do this job: it was written for the offer shape,
 * where every value is a `{value, confidence, quote}` object, and it skips
 * anything that is not one. On a paystub `grossPayCurrent` is a bare number and
 * `payFrequency` a bare string, so both were silently dropped while `lines`
 * — an array, and therefore an object — came through untouched. Nine runs
 * returned a perfect deductions table and no gross pay at all.
 *
 * Rows concatenate, because a model splitting the table across two blocks has
 * put different rows in each. Scalars take the first value seen, since there is
 * no confidence to compare and a second opinion on the same number is not
 * better than the first.
 */
export function mergePaystubInputs(inputs: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  const lines: unknown[] = []

  for (const input of inputs) {
    if (typeof input !== 'object' || input === null) continue
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key === 'lines') {
        if (Array.isArray(value)) lines.push(...value)
        continue
      }
      if (value !== undefined && merged[key] === undefined) merged[key] = value
    }
  }

  merged.lines = lines
  return merged
}

