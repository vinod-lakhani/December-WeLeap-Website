'use client'

/**
 * Take-home from the tax API, without making anyone wait for it.
 *
 * The flat state table is a decent national average and wrong for any
 * particular person: California charges about 1.5% of gross at $50,000 and
 * 3.5% at $85,000, which no single number covers. /api/tax knows the real
 * schedule for every state.
 *
 * But a tool whose whole property is answering before you tap anything cannot
 * block on a network call. So this returns the local estimate immediately and
 * swaps in the API's answer when it arrives, which is the pattern the offer
 * tool has always used with its 72% stub. Nothing ever shows a spinner where a
 * number should be.
 *
 * Debounced, because these tools recompute on every keystroke and the salary
 * field is typed one digit at a time. Without it, "60000" is five requests and
 * four of them describe salaries nobody has.
 */

import { useEffect, useRef, useState } from 'react'

export interface TaxEstimate {
  federalAnnual: number
  stateAnnual: number
  ficaAnnual: number
  /** Annual take-home, after the pre-tax money passed in. */
  netAnnual: number
  /** Where this came from, so a caller can label an estimate honestly. */
  source: 'local' | 'api'
}

/** How long to wait for typing to stop before asking. */
const SETTLE_MS = 500

export interface UseTaxEstimateArgs {
  salary: number
  state: string
  /** Pre-tax deferrals, annual. Reduces income tax but not FICA. */
  pretaxAnnual?: number
  /** The synchronous answer, shown until the API responds. */
  local: TaxEstimate | null
}

export function useTaxEstimate({ salary, state, pretaxAnnual = 0, local }: UseTaxEstimateArgs): TaxEstimate | null {
  const [api, setApi] = useState<TaxEstimate | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // A changed input invalidates whatever the API last said. Dropping back to
    // the local figure is right: a stale exact number is worse than a fresh
    // approximate one, and the difference is small enough that nobody sees a
    // jump.
    setApi(null)

    if (!(salary > 0)) return
    /**
     * No state, no call.
     *
     * The route needs one and would otherwise be handed a default, which meant
     * a visitor who had not chosen quietly got California's schedule while the
     * page told them it was assuming a national average. The local blend is
     * the honest answer to "I have not said where I live", and it is labelled
     * as one.
     */
    if (!state) return
    if (timer.current) clearTimeout(timer.current)

    const controller = new AbortController()
    timer.current = setTimeout(() => {
      fetch('/api/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaryAnnual: salary, state, pretaxAnnual }),
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          // The route was told about the deferral, so the tax it returns is
          // already net of it. What it cannot do is take the deferral out of
          // take-home, because that money is real and simply is not spendable.
          const federalAnnual = Math.max(0, d.federalTaxAnnual ?? 0)
          const stateAnnual = Math.max(0, d.stateTaxAnnual ?? 0)
          const ficaAnnual = Math.max(0, d.ficaTaxAnnual ?? 0)
          setApi({
            federalAnnual,
            stateAnnual,
            ficaAnnual,
            netAnnual: (d.netIncomeAnnual ?? 0) - pretaxAnnual,
            source: 'api',
          })
        })
        .catch(() => {
          /* The local estimate is already on screen and stays there. */
        })
    }, SETTLE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      controller.abort()
    }
  }, [salary, state, pretaxAnnual])

  return api ?? local
}
