/**
 * Check that a quote actually appears in the document it claims to come from.
 *
 * Every field carries a quote, and until now nothing verified it. The quote is
 * what makes a prefilled number checkable — it is shown in the field's tooltip
 * as the reason to believe the figure — so a quote nobody verified is a
 * provenance claim resting on the model's word.
 *
 * The risk is not hypothetical. On a real guide the premium came back quoted as
 * "Employee Pre-Tax Contributions (26 Pay Periods) ... Meritain Medical HDHP
 * Plan ... Employee", stitched from three places with the figure itself absent
 * from the quote. That extraction was correct — $51.49 a paycheck over 26
 * periods really is $111.56 a month — but a fabricated one would have looked
 * exactly the same to the validator.
 *
 * Only possible on the text path, where unpdf has already produced the source.
 * A scan has no text to check against, and the route says which path it took.
 */

/**
 * Collapse whitespace and case so a quote survives the trip through a PDF.
 *
 * Extracted text wraps mid-sentence — the match formula in one real guide reads
 * "Company match is $0.30 on every $1 employee\ndeferral up to 60% of salary"
 * — so an exact substring test fails on documents where the quote is perfect.
 * Normalising both sides is what makes the check usable rather than a source of
 * false rejections.
 */
function normalise(input: string): string {
  return input
    .toLowerCase()
    /**
     * Everything but letters, digits and spaces goes.
     *
     * Whitespace folding alone was not enough. A real guide bullets its list of
     * default plans with a glyph unpdf renders as an unprintable character; the
     * model quoted the line without it, so two identical sentences failed an
     * exact match and a correct $0 premium was dropped on every run. Em dashes,
     * curly quotes and currency symbols fail the same way.
     *
     * This is deliberately blunt, and it is still a real check: a quote the
     * document does not contain will not match a hundred characters of its
     * letters and digits in order either.
     */
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * A model may legitimately elide across a table row or a heading, so the quote
 * is split on ellipses and each piece is checked on its own. The longest piece
 * is the one that has to be real: a short fragment like "Employee" would match
 * almost any document and prove nothing.
 */
export function quoteIsGrounded(quote: string, source: string): boolean {
  const haystack = normalise(source)
  if (haystack.length === 0) return true

  const segments = quote
    .split(/…|\.\.\./)
    .map(normalise)
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) return false

  const longest = segments.reduce((a, b) => (b.length > a.length ? b : a))
  return haystack.includes(longest)
}
