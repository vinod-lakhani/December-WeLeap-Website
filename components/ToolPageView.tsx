'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'
import { fbqTrack } from '@/lib/meta-pixel'

/**
 * Fires the first step of the tool funnel, and nothing else.
 *
 * It exists so a tool page can be a server component. The pages were client
 * components purely to run this one effect, which meant they could not export
 * `metadata` — the workaround was a sibling layout.tsx holding the metadata,
 * and metadata that lives one file away from the copy it describes drifts.
 *
 * The funnel is: tool_viewed -> tool_engaged -> tool_completed ->
 * tool_cta_clicked -> cta_click_signup. Every step carries the same `tool`
 * slug from FREE_TOOLS, so it joins as one sequence. Before this, step one was
 * a per-tool event name (`offer_analysis_page_view`), which counts fine on its
 * own but cannot be the first step of a funnel whose later steps are keyed on
 * a shared name — you get a funnel that starts at "engaged" and silently drops
 * everyone who landed and left.
 *
 * `legacyEvent` keeps the old per-tool name firing alongside, so existing
 * dashboards and any saved GA4 reports do not go to zero on deploy.
 *
 * `legacyPage` exists for the same reason, one level down. When a tool's route
 * is renamed, the new events should report the new URL — otherwise every future
 * query is wrong too — but a legacy event's `page` value is part of the shape
 * its history was recorded in, and a saved report filtering on the old path
 * would quietly drop to zero. So the new events get the truth and the old event
 * keeps its own past.
 */
export function ToolPageView({
  tool,
  page,
  legacyEvent,
  legacyPage,
  toolVersion,
  pixelContentName,
}: {
  /** Analytics slug — must match the tool's `slug` in FREE_TOOLS. */
  tool: string
  /** Current route. Reported by `tool_viewed`. */
  page: string
  /** Pre-existing per-tool page-view event to keep firing. */
  legacyEvent?: string
  /** `page` value the legacy event has always sent. Defaults to `page`. */
  legacyPage?: string
  toolVersion?: string
  pixelContentName?: string
}) {
  useEffect(() => {
    // Waits for gtag (up to 3s) — page views are the one event worth waiting
    // on, since they are the denominator for everything below them.
    const timer = setTimeout(() => {
      track('tool_viewed', { tool, page }, true)
      if (legacyEvent) {
        track(
          legacyEvent,
          { page: legacyPage ?? page, ...(toolVersion ? { tool_version: toolVersion } : {}) },
          true
        )
      }
    }, 500)

    if (pixelContentName) fbqTrack('ViewContent', { content_name: pixelContentName })

    return () => clearTimeout(timer)
  }, [tool, page, legacyEvent, legacyPage, toolVersion, pixelContentName])

  return null
}
