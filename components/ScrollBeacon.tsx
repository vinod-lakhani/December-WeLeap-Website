'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'

/**
 * Fires one analytics event the first time it scrolls into view, and nothing
 * else.
 *
 * It exists for the same reason `ToolPageView` does: /how-much-rent-can-i-afford
 * was a client component solely to run an IntersectionObserver, which meant the
 * whole page shell — hero copy, method steps, FAQ — shipped as JavaScript and
 * `metadata` had to live one file away in a sibling layout.tsx. The observer is
 * now this leaf, and the page is a server component.
 *
 * `scrolled_past_how_it_works` is named in saved GA4 reports and in several
 * docs under /docs, so it keeps its exact name and params rather than being
 * folded into the shared funnel.
 */
export function ScrollBeacon({
  event,
  params,
}: {
  event: string
  params?: Record<string, string | number | boolean>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || firedRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true
            track(event, params)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
    // `params` is a literal at every call site; the event name is the identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  return <div ref={ref} aria-hidden="true" className="h-px w-full" />
}
