/**
 * Strip personal data out of document text before anything else sees it.
 *
 * This runs in two places and that is the whole reason unpdf is in the stack.
 *
 *   1. On the text unpdf pulls out of a PDF, BEFORE it is sent to the model.
 *   2. On the quotes the model sends back, before they reach the browser.
 *
 * (1) is the one that matters. The parser spec puts its regex sweep after
 * extraction — "post-extraction, run a regex sweep over every string field" —
 * which means the personal data has already left the building by the time it
 * runs. Because unpdf extracts text inside our own function, the sweep can move
 * in front of the model call instead, and an SSN in a digital offer letter is
 * removed before any third party is sent a byte of it.
 *
 * That inversion is not available on the vision path: a scanned or photographed
 * letter has no text layer to sweep, so the page image goes to the model as-is
 * and the schema in fields.ts is the only control. Two different guarantees for
 * the two paths, and the route reports which one ran.
 *
 * These patterns are deliberately eager. A false positive costs a redacted
 * quote; a false negative sends someone's SSN to a vendor.
 */

export interface RedactionResult {
  text: string
  /** How many spans were replaced. Logged as a count, never with the content. */
  hits: number
}

const PLACEHOLDER = '[redacted]'

const PATTERNS: readonly RegExp[] = [
  // SSN and ITIN, spaced, dashed or bare. The bare nine-digit case is why the
  // salary ranges in fields.ts stop at eight digits.
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // Bank account and routing numbers. A routing number is exactly nine digits;
  // account numbers run 8-17. Long digit runs have no legitimate place in the
  // fields we extract.
  /\b\d{8,17}\b/g,
  // Payment card numbers in their grouped form. The bare form is already
  // covered by the rule above, and matching "13 to 19 digits with optional
  // separators" instead would swallow whole rows of a compensation table —
  // eager is right, indiscriminate is not.
  /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}\b/g,
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
  // North American phone numbers, with or without punctuation.
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
  // Street addresses. Anchored on the unit word so "401k" and "15 days" survive.
  /\b\d{1,6}\s+[\w.'-]+(?:\s+[\w.'-]+){0,3}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|way|pl|place|ter|terrace|cir|circle|hwy|highway|pkwy|parkway)\b\.?/gi,
  // Apartment and suite lines, which often carry the number the line above
  // lost. The designator must be followed by a token CONTAINING A DIGIT, and
  // that lookahead is load-bearing: without it "unit" swallowed "restricted
  // stock unit grant" on a real letter, which is the single most common phrase
  // in the equity section of the documents this parses. An address word is
  // only an address word when a number follows it.
  /\b(?:apt|apartment|suite|ste|unit|floor|fl)\.?\s*#?\s*(?=[\w-]*\d)[\w-]{1,8}\b/gi,
  /\b\d{5}(?:-\d{4})?\b(?=\s*(?:$|[,.\n]))/g,
  // Dates of birth, when labelled. An unlabelled date is a start date and stays.
  /\b(?:date of birth|dob|birth date)\b\s*:?\s*\S{1,12}/gi,
]

/**
 * Replace every match of every pattern. Order does not matter because each pass
 * runs over the output of the last, and the placeholder contains no digits so
 * it cannot re-trigger a numeric pattern.
 */
export function redact(input: string): RedactionResult {
  let text = input
  let hits = 0
  for (const pattern of PATTERNS) {
    text = text.replace(pattern, () => {
      hits += 1
      return PLACEHOLDER
    })
  }
  return { text, hits }
}

/**
 * True when a string still looks like it carries personal data.
 *
 * Used as the last gate on model-written quotes: a quote that trips this is
 * dropped along with its field rather than shown with holes in it. The field
 * would have arrived with a redacted quote nobody could check, and an
 * unverifiable quote is worse than a missing field.
 */
export function containsPii(input: string): boolean {
  return redact(input).hits > 0
}
