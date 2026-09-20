/**
 * City income tax, which nothing else in this stack accounts for.
 *
 * /api/tax takes a `region` and returns `region_taxes_owed` — a STATE figure.
 * API Ninjas has no concept of a city, so every take-home number on this site
 * has been quietly ignoring local income tax. For most of the country that is
 * correct, because most of the country does not have one. For New York City it
 * is wrong by $2,278 a year on a $70,000 salary, which is $190 a month, and
 * NYC is the city the rent campaign leads with.
 *
 * That matters more here than the size of the number suggests. The rent page's
 * whole argument is that listing sites quote a figure built on money you never
 * receive, and ours is built on what actually lands. A take-home figure that
 * skips a tax the reader genuinely pays makes the same mistake in the same
 * direction, just by less — and it is the one error a New Yorker would spot.
 *
 * SCOPE. Rates are keyed by the city names the tools already use, so this only
 * applies where a city has actually been named. The state-only tools (offer,
 * paycheck, loan) ask for a state and cannot know, and the rent tool's "Other"
 * path knows a state but not a city; both are left alone rather than guessed
 * at, and the page says so where it shows a number.
 *
 * VERIFY BEFORE THE TAX YEAR ROLLS. Unlike lib/firstPaycheck's state table,
 * this one has no oracle — the API cannot price it, so nothing here can be
 * checked against a live source the way the state rates are. The NYC figure
 * below is worked from the published resident brackets (3.078% to $12,000,
 * 3.762% to $25,000, 3.819% to $50,000, 3.876% above, on New York taxable
 * income after an $8,000 standard deduction) and should be confirmed against
 * the New York Department of Taxation and Finance rather than trusted from
 * here.
 */

/**
 * Effective local income tax as a share of the SAME base everything else uses:
 * gross, less pre-tax deferrals, less the federal standard deduction.
 *
 * Fitted the same way the state table is, across $55,000 to $95,000. The NYC
 * schedule is graduated on a different base with a different deduction, so one
 * rate cannot track it exactly; 4.2% is within $65 a year across that range.
 *
 * Zeros are deliberate and are not placeholders. None of the other five metros
 * the rent tool offers levies a city income tax, and recording that is what
 * stops somebody "filling in the gaps" later with numbers that do not exist.
 */
const LOCAL_TAX_RATES: Record<string, number> = {
  // The rent tool's preset city names.
  NYC: 0.042,
  Austin: 0,
  'SF Bay Area': 0,
  Seattle: 0,
  Boston: 0,
  Chicago: 0,

  /**
   * The same places under their ZORI region names, which is what the offer
   * tool holds — its city select is populated from /api/zori, so its value for
   * New York is "New York, NY" rather than "NYC".
   *
   * Two key spaces for one concept is not lovely, and the alternative was
   * worse: a lookup that silently misses is indistinguishable from a city with
   * no local tax, and it would have missed on exactly the city that has one.
   * The entries are here rather than mapped at the call site so that adding a
   * city means editing one table.
   */
  'New York, NY': 0.042,
  'Austin, TX': 0,
  'San Francisco, CA': 0,
  'Seattle, WA': 0,
  'Boston, MA': 0,
  'Chicago, IL': 0,
}

/** The rate for a named city. Zero for anywhere this does not know about. */
export function localTaxRate(city: string): number {
  return LOCAL_TAX_RATES[city] ?? 0
}

/** Whether this city actually levies one, as opposed to being unknown or zero. */
export function hasLocalTax(city: string): boolean {
  return localTaxRate(city) > 0
}

/**
 * Local tax owed, on a taxable base already net of deferrals and the standard
 * deduction — the same number the state figure is charged on.
 */
export function localTaxAnnual(city: string, taxableAnnual: number): number {
  return Math.max(0, taxableAnnual) * localTaxRate(city)
}
