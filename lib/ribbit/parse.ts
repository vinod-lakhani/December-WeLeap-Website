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

/** A dollar amount from free text: "$62,000", "62k", "62.5k", "around 5k", "5,200/mo", "1.2m". Null if none. */
export function parseMoney(text: string): number | null {
  const m = text.toLowerCase().replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|thousand|m|million)?\b/)
  if (!m) return null
  const n = parseFloat(m[1])
  if (!Number.isFinite(n)) return null
  const mult = m[2] === 'k' || m[2] === 'thousand' ? 1_000 : m[2] === 'm' || m[2] === 'million' ? 1_000_000 : 1
  const v = Math.round(n * mult)
  return v > 0 ? v : null
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

/** The state code for a preset city, so a typed "Austin" can be priced like a tapped one. */
export function stateForPresetCity(city: string): string | undefined {
  return getStateCodeForCity(city)
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
