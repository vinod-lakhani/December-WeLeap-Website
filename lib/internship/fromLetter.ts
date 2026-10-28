/**
 * Turn what was read off an internship letter into form inputs.
 *
 * Pure, so the mapping is tested rather than eyeballed. Two rules:
 *
 * - Nothing the letter did not state is filled in. A match rate with no cap
 *   sets the rate and leaves the cap for the visitor; it is not completed with
 *   a typical value, because a guessed number on a form looks exactly like a
 *   read one.
 * - A housing lump sum goes into the one-off allowance, not the monthly
 *   stipend. That is the case the Purdue tester raised — a one-time housing
 *   payment, taxed — and the one-off field is the one that taxes it right.
 *
 * `fields` names what was set, in the tool's own change vocabulary, so an
 * upload counts toward completion the same way typing those fields would.
 */

import { internshipWeeks, type ParsedInternship } from '@/lib/offer-parse/internship'
import type { InternshipInputs } from './calculation'

export function inputsFromLetter(p: ParsedInternship): { patch: Partial<InternshipInputs>; fields: string[] } {
  const patch: Partial<InternshipInputs> = {}
  const fields: string[] = []

  // One pay shape. If a letter somehow states two, hourly is the precise one.
  if (p.hourlyRate) {
    patch.payShape = 'hourly'
    patch.hourlyRate = p.hourlyRate.value
    fields.push('pay')
  } else if (p.monthlyStipend) {
    patch.payShape = 'monthly'
    patch.monthlyStipend = p.monthlyStipend.value
    fields.push('pay')
  } else if (p.termLumpSum) {
    patch.payShape = 'lump'
    patch.lumpSum = p.termLumpSum.value
    fields.push('pay')
  }

  if (p.hoursPerWeek) {
    patch.hoursPerWeek = p.hoursPerWeek.value
    fields.push('hours')
  }

  const weeks = internshipWeeks(p)
  if (weeks !== null) {
    patch.weeks = weeks
    fields.push('weeks')
  }

  if (p.workStateCode) {
    patch.state = p.workStateCode.value
    fields.push('state')
  }

  if (p.housingProvided) {
    patch.housing = 'provided'
    fields.push('housing')
  } else if (p.housingStipendMonthly) {
    patch.housing = 'stipend'
    patch.housingStipendMonthly = p.housingStipendMonthly.value
    fields.push('housing_stipend')
  }

  const oneOff = (p.relocationAllowance?.value ?? 0) + (p.housingLumpSum?.value ?? 0)
  if (oneOff > 0) {
    patch.relocation = oneOff
    fields.push('relocation')
  }

  if (p.matchRatePct || p.matchUpToPct) {
    if (p.matchRatePct) patch.matchRatePct = p.matchRatePct.value
    if (p.matchUpToPct) {
      patch.matchUpToPct = p.matchUpToPct.value
      // Follows the cap, as it does when typed — the least that captures the match.
      patch.contributionPct = p.matchUpToPct.value
    }
    fields.push('match')
  }

  return { patch, fields }
}
