'use client'

/**
 * The two funnel events every tool has to agree on.
 *
 * `tool_completed` used to be defined per tool, from each tool's own state
 * machine, on the reasoning that firing it at the same moment as
 * `tool_engaged` makes the step between them measure nothing. That reasoning
 * is right and the consequence was not: a gate that differs between tools —
 * or, once campaign landings existed, between two traffic sources on the SAME
 * tool — produces numbers that cannot be compared to each other. A channel
 * test run on a metric whose definition moves with the channel is not a test.
 *
 * So there is one rule now:
 *
 *     tool_completed = a result is on screen AND the visitor did something
 *
 * "Did something" means a changed input, or a document that parsed — an upload
 * that fills the form is the highest-intent action a tool can offer, and
 * counting it as zero engagement reported those people as bounces.
 *
 * `tool_result_shown` carries the other moment, the one completion used to be
 * overloaded with: a result rendered, whoever put it there. For the tools that
 * compute from defaults — the campaign landings, the loan tool, the saving
 * calculator — that is page load, and saying so plainly is more useful than a
 * completion event that quietly means "arrived" on three tools and "typed
 * something" on the rest.
 */

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics'

/**
 * Fires `tool_result_shown` once, the first time a result exists.
 *
 * `campaign` is sent only when true, so the ordinary payload stays identical
 * across sources and a dashboard can still split on it when it needs to.
 */
export function useResultShown(tool: string, hasResult: boolean, campaign = false, extra?: Record<string, unknown>) {
  const fired = useRef(false)
  // Read at the moment it fires: the event describes the first result, not whatever the props become later.
  const extraRef = useRef(extra)
  extraRef.current = extra

  useEffect(() => {
    if (!hasResult || fired.current) return
    fired.current = true
    track('tool_result_shown', { tool, ...(campaign ? { campaign: true } : {}), ...(extraRef.current ?? {}) })
  }, [tool, hasResult, campaign])
}


/* ------------------------------------------------------------------ *
 * Once per session, not once per mount.
 * ------------------------------------------------------------------ */

const COMPLETED_KEY = 'wle_tool_completed'

/**
 * Whether this tool has already reported a completion in this tab.
 *
 * The guard used to be a ref, which is per MOUNT. A reload re-armed it, so
 * somebody who worked out their rent, refreshed, and changed a field again
 * produced two completions — and a cost-per-completion figure divides by that
 * number. `run_index` records that a second run happened; it was never meant
 * to suppress the event.
 *
 * sessionStorage rather than localStorage, deliberately. A person coming back
 * tomorrow with a different salary HAS completed the tool again and should
 * count again; what must not count twice is one sitting. Per tab is the
 * closest available stand-in for one sitting.
 *
 * Fails open. If storage throws — Safari private mode, blocked site data — the
 * event fires. Missing a duplicate is better than missing every completion on
 * a browser that will not let us remember.
 */
function completedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(COMPLETED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/**
 * Claims the one completion this tool gets this session.
 *
 * Returns true the first time and false afterwards, so a caller can use it
 * directly as the gate. Writing happens inside the claim rather than being
 * left to the caller: a check-then-set split across two call sites is how a
 * guard ends up not guarding.
 */
export function claimToolCompletion(tool: string): boolean {
  /**
   * Keyed on sessionStorage rather than window, because storage is the actual
   * dependency. The two differ in the case that matters: on the server there
   * is no storage and no event should fire, while in a browser that refuses
   * storage there IS a visitor and the event should. Checking `window` cannot
   * tell those apart.
   */
  if (typeof sessionStorage === 'undefined') return false
  const seen = completedSet()
  if (seen.has(tool)) return false
  seen.add(tool)
  try {
    sessionStorage.setItem(COMPLETED_KEY, JSON.stringify([...seen]))
  } catch {
    /* fails open: the event still fires, it just may fire again after a reload */
  }
  return true
}

/** Test seam. Never called by a component. */
export function __resetToolCompletions(): void {
  try {
    sessionStorage.removeItem(COMPLETED_KEY)
  } catch {
    /* nothing to reset */
  }
}
