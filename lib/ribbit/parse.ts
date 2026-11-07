/**
 * Reading what somebody typed into the Ribbit chat, against the same lists the tool pages use.
 *
 * Chips are the primary control, but the field is always there, and "around 5k" or "austin" has to land the same
 * as tapping. Nothing here guesses a value the person did not give: a number that could be either a salary or a
 * monthly take-home is read by size and the reply states which it took, and a location that matches nothing
 * comes back null so the chat asks again rather than picking the nearest city.
 */
import { getAvailableCities, getStateCodeForCity } from '@/lib/cities'
import { US_STATES_NAMED } from '@/lib/states'

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, a: 1,
}

/**
 * An amount written in words: "three hundred", "eighty grand", "five thousand two hundred". Null if the text has
 * no number words. Ribbit's reader rejects a value that is not literally in the message (a guard against made-up
 * numbers), so the chat reads these itself rather than sending them on.
 */
function wordsToNumber(text: string): number | null {
  const words = text.toLowerCase().replace(/-/g, ' ').match(/[a-z]+/g) ?? []
  let total = 0
  let current = 0
  let seen = false
  for (const w of words) {
    if (w in UNITS && w !== 'a') { current += UNITS[w]; seen = true }
    else if (w === 'a' && !seen) { current += 1 }
    else if (w === 'hundred') { current = (current || 1) * 100; seen = true }
    else if (w === 'thousand' || w === 'grand' || w === 'k') { total += (current || 1) * 1_000; current = 0; seen = true }
    else if (w === 'million') { total += (current || 1) * 1_000_000; current = 0; seen = true }
  }
  const n = total + current
  return seen && n > 0 ? n : null
}

/** A dollar amount from free text: "$62,000", "62k", "62.5k", "around 5k", "5,200/mo", "1.2m", "three hundred". Null if none. */
export function parseMoney(text: string): number | null {
  const m = text.toLowerCase().replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|thousand|grand|m|million)?\b/)
  if (!m) return wordsToNumber(text)
  const n = parseFloat(m[1])
  if (!Number.isFinite(n)) return null
  const mult = m[2] === 'k' || m[2] === 'thousand' || m[2] === 'grand' ? 1_000 : m[2] === 'm' || m[2] === 'million' ? 1_000_000 : 1
  const v = Math.round(n * mult)
  return v > 0 ? v : null
}

/** As parseMoney, with the cents kept: a price per share ("$4.40", "1.10"). "20 million" is 20,000,000. */
export function parseDecimal(text: string): number | null {
  const m = text.toLowerCase().replace(/,/g, '').match(/(\d*\.?\d+)\s*(k|thousand|m|mm|million|b|billion)?\b/)
  if (!m) return null
  const n = parseFloat(m[1])
  const mult = m[2] === 'k' || m[2] === 'thousand' ? 1e3 : m[2] === 'm' || m[2] === 'mm' || m[2] === 'million' ? 1e6 : m[2] === 'b' || m[2] === 'billion' ? 1e9 : 1
  const v = n * mult
  return Number.isFinite(v) && v > 0 ? v : null
}

/**
 * A grant as people type it: "20,000 at $1.10", "20k options, strike 1.10", "5000 RSUs". The count is the first
 * whole number of 100 or more; the strike is a dollar amount, else a number with cents, else the other of two.
 */
export function parseGrant(text: string): { shares?: number; strike?: number; rsu: boolean } {
  const rsu = /\brsus?\b|restricted stock units?/i.test(text)
  const tokens = [...text.toLowerCase().replace(/,/g, '').matchAll(/(\$)?\s*(\d*\.?\d+)\s*(k|thousand|m|million)?\b/g)].map((m) => {
    const mult = m[3] === 'k' || m[3] === 'thousand' ? 1e3 : m[3] === 'm' || m[3] === 'million' ? 1e6 : 1
    return { dollar: Boolean(m[1]), cents: m[2].includes('.') && !m[3], v: parseFloat(m[2]) * mult }
  })
  const count = tokens.find((t) => !t.dollar && t.v >= 100 && Number.isInteger(t.v))
  const rest = tokens.filter((t) => t !== count && t.v > 0 && t.v < 10_000)
  const strike = rest.find((t) => t.dollar) ?? rest.find((t) => t.cents) ?? (tokens.length === 2 && count ? rest[0] : undefined)
  return { shares: count?.v, strike: rsu ? undefined : strike?.v, rsu }
}

/** Two amounts, in the order typed ("4,200 at 24%" → [4200, 24]). Used for a card's balance and rate. */
export function parseTwoNumbers(text: string): [number, number] | null {
  const nums = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 2) return null
  return [parseFloat(nums[0]), parseFloat(nums[1])]
}

/**
 * Salary or monthly take-home, when the person typed a bare number. Annual pay below $20,000 is not a full-time
 * salary this tool is built for, and a monthly take-home above it is not a first job; between the two readings
 * the size decides, and the chat says back which one it used so a wrong read is one tap to fix.
 */
export function salaryOrTakeHome(n: number): 'salary' | 'take_home' {
  return n >= 20_000 ? 'salary' : 'take_home'
}

/** Base pay as the offer's first question reads it (lib/ribbit/engine.ts O1). */
export type Pay =
  | { kind: 'salary'; annual: number }
  | { kind: 'hourly'; rate: number; hours: number; annual: number }
  | { kind: 'unsure'; n: number }

const HOUR_MARK = /(\/\s*h(ou)?r\b|(?<=\d)\s*h(ou)?r\b|\bper\s+h(ou)?r\b|\ban?\s+h(ou)?r\b|\bhourly\b|\bp\/?h\b)/i
const HOURS_A_WEEK = /(\d{1,2})\s*(?:hours|hrs)\b(?:\s*(?:a|per|\/|each)\s*(?:week|wk))?|(\d{1,2})\s*(?:hour|hr|h)\s*(?:a|per|\/)\s*(?:week|wk)\b/i
/** A full-time week, as the offer page assumes when nobody says otherwise. */
export const DEFAULT_HOURS = 40

/**
 * A base pay typed at the offer's first question: a yearly salary, or an hourly rate with its hours a week
 * ("19.50", "$22/hr", "18 an hour, 30 hours a week"). The rate keeps its cents: parseMoney rounded "19.50" to 20,
 * and the chat sent it to Ribbit as a question. `basis` is the tapped option, Yearly or Hourly. With no option
 * tapped, a rate in cents under $200 or one marked per hour is hourly; a bare 10 to 999 could be either ($95 an hour
 * or $95k a year), so it comes back unsure and the chat asks which, rather than guess.
 */
export function readPay(text: string, basis?: 'salary' | 'hourly'): Pay | null {
  const lower = text.toLowerCase().replace(/,/g, '')
  const hoursMatch = lower.match(HOURS_A_WEEK)
  const hoursTyped = hoursMatch ? Number(hoursMatch[1] ?? hoursMatch[2]) : null
  const hours = hoursTyped && hoursTyped >= 1 && hoursTyped <= 80 ? hoursTyped : DEFAULT_HOURS
  const rest = (hoursMatch ? lower.replace(hoursMatch[0], ' ') : lower).replace(/(\d)([a-z])/g, '$1 $2')
  const m = rest.match(/(\d+(?:\.\d+)?)\s*(k|thousand|grand|m|million)?\b/)
  if (m?.[2]) {
    const annual = parseMoney(rest)
    return annual ? { kind: 'salary', annual } : null
  }
  const n = m ? parseFloat(m[1]) : wordsToNumber(rest)
  if (!n || !Number.isFinite(n) || n <= 0) return null
  const cents = Boolean(m && /\.\d/.test(m[1]))
  const hourly = HOUR_MARK.test(rest) || (basis === 'hourly' && n < 1_000) || (!basis && cents && n < 200)
  if (hourly) {
    if (n < 1) return null
    return { kind: 'hourly', rate: Math.round(n * 100) / 100, hours, annual: Math.round(n * hours * 52) }
  }
  if (n >= 1_000) return { kind: 'salary', annual: Math.round(n) }
  return n >= 10 ? { kind: 'unsure', n: Math.round(n) } : null
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

/** One of the rent page's preset cities, matched loosely ("austin", "Austin, TX", "nyc"). Null if none. */
export function matchPresetCity(text: string, cities: readonly string[] = getAvailableCities()): string | null {
  const t = norm(text)
  if (!t) return null
  // The rent page's preset names, as people type them.
  const aliases: Record<string, string> = {
    'new york': 'NYC', 'new york city': 'NYC', manhattan: 'NYC', brooklyn: 'NYC', ny: 'NYC',
    sf: 'SF Bay Area', 'san francisco': 'SF Bay Area', 'bay area': 'SF Bay Area', oakland: 'SF Bay Area', 'san jose': 'SF Bay Area',
  }
  const target = aliases[t] ?? t
  const exact = cities.find((c) => norm(c) === norm(target))
  if (exact) return exact
  const first = norm(target).split(' ').slice(0, 2).join(' ')
  return cities.find((c) => norm(c).startsWith(first) && first.length >= 3) ?? null
}

/** A US state from its name or two-letter code ("texas", "TX"). Null if none. */
export function matchState(text: string): { code: string; name: string } | null {
  const raw = text.trim()
  if (/^[A-Za-z]{2}$/.test(raw)) {
    const hit = US_STATES_NAMED.find((s) => s.code === raw.toUpperCase())
    if (hit) return hit
  }
  const t = norm(raw)
  return US_STATES_NAMED.find((s) => norm(s.name) === t) ?? US_STATES_NAMED.find((s) => t.includes(norm(s.name))) ?? null
}

/**
 * A typed place split into its city and, when one was given, its state: "Dallas, TX", "charlotte nc", "Houston
 * Texas", "Dallas". A text that is only a state ("Texas", "TX") has no city.
 */
export function splitCityState(text: string): { city: string; stateCode?: string } {
  const t = text.trim().replace(/\s+/g, ' ').replace(/[.]+$/, '')
  if (matchState(t) && (norm(t).length <= 2 || US_STATES_NAMED.some((s) => norm(s.name) === norm(t)))) return { city: '' }
  const code = t.match(/^(.+?)[,\s]+([A-Za-z]{2})$/)
  if (code) {
    const st = US_STATES_NAMED.find((s) => s.code === code[2].toUpperCase())
    if (st) return { city: code[1].trim(), stateCode: st.code }
  }
  const named = [...US_STATES_NAMED].sort((a, b) => b.name.length - a.name.length)
    .find((s) => norm(t).endsWith(` ${norm(s.name)}`) && norm(t).length > norm(s.name).length + 2)
  if (named) return { city: t.slice(0, t.length - named.name.length).replace(/[,\s]+$/, ''), stateCode: named.code }
  return { city: t }
}

/** The state code for a preset city, so a typed "Austin" can be priced like a tapped one. */
export function stateForPresetCity(city: string): string | undefined {
  return getStateCodeForCity(city)
}

/**
 * A debt typed in one line: "card, 4000 at 22%, I pay 150", "$12k student loan 6.8% paying 250 a month". The rate
 * is the number with a %, the payment the number after "pay"/"paying" or before "a month"/"/mo", the balance the
 * largest of the rest. Whatever is missing comes back undefined, for the chat to ask.
 */
export function parseDebt(text: string): { balance?: number; aprPct?: number; payment?: number; kind?: 'card' | 'loan' } {
  const t = text.toLowerCase().replace(/,/g, '')
  const out: { balance?: number; aprPct?: number; payment?: number; kind?: 'card' | 'loan' } = {}
  // What it is, so the app files it as a credit card or a loan.
  if (/\b(card|credit)\b/.test(t)) out.kind = 'card'
  else if (/\b(loan|car|auto|student|mortgage|personal)\b/.test(t)) out.kind = 'loan'
  const rate = t.match(/(\d+(?:\.\d+)?)\s*%/)
  if (rate) out.aprPct = parseFloat(rate[1])
  const pay = t.match(/pay(?:ing|s)?\s*(?:about\s*)?\$?(\d+(?:\.\d+)?k?)/) ?? t.match(/\$?(\d+(?:\.\d+)?k?)\s*(?:a|per|\/)\s*(?:month|mo)\b/)
  if (pay) out.payment = parseMoney(pay[1]) ?? undefined
  const rest = t
    .replace(rate?.[0] ?? '\u0000', ' ')
    .replace(pay?.[0] ?? '\u0000', ' ')
  const amounts = (rest.match(/\$?\d+(?:\.\d+)?k?/g) ?? []).map((m) => parseMoney(m.replace('$', ''))).filter((n): n is number => n !== null)
  if (amounts.length) out.balance = Math.max(...amounts)
  return out
}

/**
 * A 401(k) match formula: "100% up to 4%", "50% of 6%", "dollar for dollar up to 5%". A single percentage is
 * ambiguous (the rate or the cap?) and comes back with only the cap, for the chat to confirm the rate.
 */
export function parseMatch(text: string): { rate?: number; cap: number } | null {
  const t = text.toLowerCase()
  const nums = (t.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
  const dollarForDollar = /dollar for dollar|1:1|one for one|full match/.test(t)
  if (nums.length >= 2) return { rate: nums[0], cap: nums[1] }
  if (nums.length === 1) return dollarForDollar ? { rate: 100, cap: nums[0] } : { cap: nums[0] }
  return null
}

/**
 * A typed question for the question log, without what should not be in an analytics event: long digit runs
 * (phone and account numbers) and email addresses. Salaries and rents are short and stay.
 */
export function redactForLog(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{8,}\d/g, '[number]')
    .slice(0, 200)
}
