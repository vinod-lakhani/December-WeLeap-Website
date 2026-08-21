'use client'

/**
 * When a tool's feedback prompt appears.
 *
 * Every tool used to render its prompt as part of the results block, so it was
 * on screen the instant a result existed — before the visitor had done anything
 * with the answer. On the payoff tool that means the prompt has been sitting
 * there through roughly forty slider drags by the time the person has an
 * opinion worth giving, which is the definition of furniture.
 *
 * These two hooks defer it instead. Both are sticky: once a prompt is revealed
 * it stays revealed, so a prompt never disappears out from under someone
 * reaching for it.
 *
 * Money Plan is the reason this exists. It is the only tool that already asks
 * at the right moment — its prompt lives in a summary step you cannot reach
 * without finishing the flow — and it is also the only one with a response rate
 * worth having. The other tools cannot copy its structure, so they copy its
 * timing.
 */

import { useEffect, useState } from 'react'

/**
 * Reveals once `quietMs` passes with no change to `activity`.
 *
 * The debounce is the effect's own dependency array: each new `activity` value
 * tears down the pending timer and starts a fresh one, so the reveal lands on
 * the trailing edge of a burst of interaction rather than the leading edge.
 *
 * If the visitor never interacts at all, this still fires `quietMs` after
 * `enabled` turns true. That is intentional — someone who read the answer and
 * did nothing for fifteen seconds has also finished forming a view.
 *
 * @param activity  Any value that changes on each qualifying interaction.
 * @param quietMs   How long the interaction must stay stopped. Long enough to
 *                  survive a pause mid-exploration.
 * @param enabled   Gate on a real result existing. Nothing is timed before it.
 */
export function useQuietReveal(
  activity: unknown,
  { quietMs, enabled }: { quietMs: number; enabled: boolean }
): boolean {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!enabled || revealed) return
    const timer = setTimeout(() => setRevealed(true), quietMs)
    return () => clearTimeout(timer)
  }, [activity, quietMs, enabled, revealed])

  return revealed
}

/**
 * Reveals once `count` qualifying actions have happened.
 *
 * For tools where the signal is "they engaged enough to have a view" rather
 * than "they stopped". The offer analyser computes live with no submit, so it
 * has no single moment a result lands; the rent tool's signal is a second run,
 * because a re-runner has two scenarios to compare.
 */
export function useCountReveal(
  count: number,
  { threshold, enabled }: { threshold: number; enabled: boolean }
): boolean {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!revealed && enabled && count >= threshold) setRevealed(true)
  }, [count, threshold, enabled, revealed])

  return revealed
}
