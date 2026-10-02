/**
 * Meta Pixel loader, callable from anywhere.
 *
 * Why a module and not just the <MetaPixel> component: in app/layout.tsx the
 * page content renders before <MetaPixel />, and React runs effects in that
 * order, so /get's Lead-event effect ran before the pixel existed and
 * `window.fbq?.()` silently did nothing. Here the first caller — component or
 * page — creates the stub, queues `init`, and appends the script; later
 * calls are queued by the stub and flushed by fbevents.js in order.
 *
 * Inert when NEXT_PUBLIC_META_PIXEL_ID is unset. Consent gating is
 * deliberately deferred to one later change covering GA, PostHog and this.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: unknown
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/** True when the pixel is configured and the stub is in place (loads it if not). */
export function loadMetaPixel(): boolean {
  if (!PIXEL_ID || typeof window === 'undefined') return false
  if (window.fbq) return true
  // Standard base code, minus the <noscript> image.
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args)
    else n.queue.push(args)
  } as Fbq
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  window.fbq = n
  if (!window._fbq) window._fbq = n
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  n('init', PIXEL_ID)
  return true
}

/** fbq(...) that never throws and never fires before init is queued. */
export function fbq(...args: unknown[]): void {
  try {
    if (loadMetaPixel()) window.fbq!(...args)
  } catch {
    /* analytics must never break the page */
  }
}
