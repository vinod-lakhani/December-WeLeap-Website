'use client'

/**
 * The offer tool's current figures, for the "7 numbers in your offer" chips.
 *
 * The chips sit below the tool on a server-rendered page, as a sibling rather
 * than a child, so they cannot take props from it. A provider would mean
 * turning the page into a client component; a module-level store read through
 * useSyncExternalStore does the same job without touching the page.
 *
 * The tool publishes exactly what its result card shows — `shown` and
 * `shownInputs`, the entered-data figures — so a chip can never state a number
 * the card above it does not. `null` means no result yet: the chips fall back
 * to their general explanation.
 */

import { useSyncExternalStore } from 'react'

export interface OfferFigures {
  salary: number
  takeHomeMonthly: number
  bonusPct: number
  annualBonus: number
  bonusEntered: boolean
  matchRatePct: number
  matchUpToPct: number
  annual401kMatch: number
  matchEntered: boolean
  annualHsa: number
  /** Negative: the employee's premium is a cost. */
  annualHealthcare: number
  benefitsEntered: boolean
  rsuAnnual: number
  annualEspp: number
  equityEntered: boolean
  ptoDays: number
  ptoValue: number
  ptoEntered: boolean
  rentMonthly: number
  rentPct: number | null
}

let current: OfferFigures | null = null
const listeners = new Set<() => void>()

export function publishOfferFigures(next: OfferFigures | null): void {
  current = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useOfferFigures(): OfferFigures | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  )
}
