/**
 * Meta (Facebook) Pixel standard-event helper.
 *
 * The base pixel is installed via components/meta-pixel.tsx. This wrapper fires
 * Meta *standard events* for the Phase 0 funnel:
 *   - ViewContent          on tool pages
 *   - Lead                 on tool_completed
 *   - CompleteRegistration on signup success (fired on the app, not here)
 *
 * No-ops safely when the pixel isn't loaded (e.g. no pixel ID configured, or
 * consent not granted), so call sites don't need to guard.
 */

type FbqStandardEvent = "ViewContent" | "Lead" | "CompleteRegistration" | "PageView"

declare global {
  interface Window {
    fbq?: (command: string, event: string, params?: Record<string, any>) => void
  }
}

/** Fire a Meta Pixel standard event. Safe to call anywhere; no-ops if unavailable. */
export function fbqTrack(event: FbqStandardEvent, params?: Record<string, any>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  try {
    window.fbq("track", event, params || {})
  } catch {
    // Never let pixel errors break the app.
  }
}
