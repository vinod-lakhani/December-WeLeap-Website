/**
 * How many times this browser has completed a given tool.
 *
 * `tool_completed` fires once per visit, so `count()` and `uniq(person_id)`
 * already separate runs from people in aggregate. What they cannot do is tell
 * you WHICH run a given event was — whether the answer someone acted on was
 * their first or their fourth. That distinction is the interesting one: a
 * re-runner has compared two scenarios, and their behaviour after the result
 * is not comparable to a first-timer's.
 *
 * localStorage, not sessionStorage: someone who works out their rent, sleeps
 * on it and comes back tomorrow is on run two, not run one.
 */

const KEY_PREFIX = 'wle_runs_'

/**
 * Increment and return the run number for a tool, starting at 1.
 *
 * Returns 1 and stores nothing when storage is unavailable — private mode, a
 * blocked origin, a full quota. A wrong run_index of 1 is a known and harmless
 * bias; an exception thrown inside an analytics call site is not.
 */
export function nextRunIndex(tool: string): number {
  if (typeof window === 'undefined') return 1
  const key = `${KEY_PREFIX}${tool}`
  try {
    const previous = parseInt(window.localStorage.getItem(key) ?? '0', 10)
    // A corrupted or hand-edited value restarts the count rather than
    // propagating NaN into every future event for this browser.
    const next = Number.isInteger(previous) && previous >= 0 ? previous + 1 : 1
    window.localStorage.setItem(key, String(next))
    return next
  } catch {
    return 1
  }
}

/** Read without incrementing. Exposed for tests and debugging. */
export function currentRunIndex(tool: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const value = parseInt(window.localStorage.getItem(`${KEY_PREFIX}${tool}`) ?? '0', 10)
    return Number.isInteger(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}
