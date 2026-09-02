import { US_STATES } from '@/lib/states'
import {
  OFFER_FIELD_KEYS,
  MIN_CONFIDENCE,
  isInRange,
  isStateCode,
  type OfferFieldKey,
  type ParsedOffer,
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
