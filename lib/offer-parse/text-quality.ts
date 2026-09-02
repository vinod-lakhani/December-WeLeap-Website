/**
 * Is this extracted paystub text usable, or has the table been destroyed?
 *
 * A paystub is a grid of money, and unpdf reads grids by walking the page in
 * whatever order the PDF happens to store its text runs. On a cleanly authored
 * stub that produces intact rows. On a real ADP earnings statement it produces
 * this:
 *
 *   Net Pay $5 358 89
 *   Regular 10802 08 86 67 10 802 08 160 489 56
 *   -2 134 76 35 399 79
 *
 * Two interleaved columns with the decimal separators gone. $5,358.89 becomes
 * "$5 358 89", and every figure on the page is now ambiguous. The model does
 * not fail cleanly on that — it spends 25 seconds trying, and times out.
 *
 * The route already falls back to vision when there is NO text. This is the
 * case it was missing: text that exists and is worthless.
 *
 * WHY CENTS. Every US payroll system prints them — gross, net and each
 * deduction all carry two decimal places. So a stub whose extracted text has
 * numbers but no figures shaped like 1234.56 has lost its separators, and the
 * measurement is not close: three cleanly extracted stubs scored 28, 30 and 32
 * such figures, while two real ADP statements scored zero apiece out of 147 and
 * 165 numeric runs. There is no threshold to agonise over between 0 and 28.
 *
 * This is paystub-only on purpose. An offer letter says "$145,000" with no
 * cents at all, and a benefits guide is prose — the same test would send both
 * to vision for no reason.
 */

/** Figures shaped like money: 1234.56, 10,802.08, 5.00. */
const WITH_CENTS = /\d[\d,]*\.\d{2}\b/g

/** Any run of digits, to tell an empty document from a mangled one. */
const NUMERIC_RUN = /\b\d[\d,]*\b/g

/**
 * Four, against an observed 28 on the worst good case and 0 on the bad ones.
 *
 * Deliberately nowhere near either edge. Every paystub prints at least a gross,
 * a net and a couple of deductions, so four is unreachable by a real stub that
 * extracted correctly, and unreachable in the other direction by one that did
 * not.
 */
const MIN_MONEY_FIGURES = 4

export interface TextQuality {
  usable: boolean
  moneyFigures: number
  numericRuns: number
}

export function assessPaystubText(text: string): TextQuality {
  const moneyFigures = (text.match(WITH_CENTS) ?? []).length
  const numericRuns = (text.match(NUMERIC_RUN) ?? []).length
  return { usable: moneyFigures >= MIN_MONEY_FIGURES, moneyFigures, numericRuns }
}
