/**
 * Lazy PostHog access.
 *
 * `posthog-js` is ~59 KB gzipped and was in the initial JS of every marketing
 * page, parsed and executed during hydration. It is now fetched in a separate
 * chunk after mount.
 *
 * The naive version of this change does not work. `posthog-js/react` statically
 * imports the whole SDK (`dist/esm/index.js:1`), so dynamically importing
 * `posthog-js` while any component still imports `usePostHog` from the standard
 * entry point pulls it straight back into the bundle. Callers must use
 * `posthog-js/react/slim`, which imports React and nothing else.
 *
 * Slim has no fallback instance — its `defaultPostHogInstance` is declared and
 * never assigned, and its provider reads `client.config` with no null guard. So
 * something real has to exist from the first render. That is what `stub` is:
 * it satisfies the provider, and it queues `capture` and `identify` calls
 * instead of dropping them.
 *
 * Queuing is the point. Without it the first `$pageview` — fired on mount, the
 * denominator for the entire tool funnel — races the import and is lost on slow
 * connections, which is precisely the population you least want to stop
 * measuring.
 */

import type { PostHog } from 'posthog-js'

type QueuedCall =
  | { kind: 'capture'; args: Parameters<PostHog['capture']> }
  | { kind: 'identify'; args: Parameters<PostHog['identify']> }

let real: PostHog | null = null
let loading: Promise<PostHog | null> | null = null
const queue: QueuedCall[] = []

/** Cap the queue so a misconfigured key cannot grow it without bound. */
const MAX_QUEUED = 100

/**
 * Stands in until the SDK lands. Only the methods this codebase actually calls
 * are implemented — `capture`, `identify`, `get_distinct_id`. Anything else
 * reaching for a PostHog method through this object is a bug worth seeing, not
 * something to silently absorb, so it is deliberately not a catch-all proxy.
 */
const stub = {
  // Read by slim's provider on every render. Must exist.
  config: undefined,
  capture: (...args: Parameters<PostHog['capture']>) => {
    if (queue.length < MAX_QUEUED) queue.push({ kind: 'capture', args })
    return undefined
  },
  identify: (...args: Parameters<PostHog['identify']>) => {
    if (queue.length < MAX_QUEUED) queue.push({ kind: 'identify', args })
  },
  // No id exists before init. `lib/app-link.ts` already treats a missing
  // distinct_id as "link still works, just unstitched", which is the correct
  // degradation for the handful of clicks that could land this early.
  get_distinct_id: () => undefined,
} as unknown as PostHog

/**
 * The instance to call. Returns the stub until the SDK is ready, so callers
 * never branch on load state.
 */
export function getPostHog(): PostHog {
  return real ?? stub
}

/**
 * Loads and initialises the SDK, then replays anything queued. Safe to call
 * more than once — the in-flight promise is shared and init runs once.
 *
 * Resolves to null when no key is configured, matching how GA4 and the Meta
 * Pixel no-op rather than initialising against nothing.
 */
export function loadPostHog(): Promise<PostHog | null> {
  if (real) return Promise.resolve(real)
  if (loading) return loading

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return Promise.resolve(null)

  loading = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // handled by components/posthog-pageview.tsx
        capture_pageleave: true,
      })

      real = posthog

      // Drain in order. Splice first so a throw cannot replay a call twice.
      const pending = queue.splice(0, queue.length)
      for (const call of pending) {
        try {
          if (call.kind === 'capture') posthog.capture(...call.args)
          else posthog.identify(...call.args)
        } catch {
          // One bad event must not strand the rest of the queue.
        }
      }

      return posthog
    })
    .catch(() => {
      // Blocked by an ad blocker, offline, chunk 404 — all normal. Drop the
      // queue rather than holding it forever, and let a later call retry.
      queue.length = 0
      loading = null
      return null
    })

  return loading
}
