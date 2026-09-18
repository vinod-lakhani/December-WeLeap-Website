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
export function useResultShown(tool: string, hasResult: boolean, campaign = false) {
  const fired = useRef(false)

  useEffect(() => {
    if (!hasResult || fired.current) return
    fired.current = true
    track('tool_result_shown', { tool, ...(campaign ? { campaign: true } : {}) })
  }, [tool, hasResult, campaign])
}
