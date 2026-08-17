'use client'

import type { PostHog } from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react/slim'
import { useEffect, useState } from 'react'
import { getPostHog, loadPostHog } from '@/lib/posthog-lazy'

/**
 * Imports the *slim* React binding on purpose. The standard `posthog-js/react`
 * entry point statically imports the whole SDK, so using it here would put
 * ~59 KB gzipped back into the initial bundle of every page no matter how the
 * SDK itself is loaded. See lib/posthog-lazy.ts.
 *
 * The provider always renders with a client — the stub first, the real
 * instance once loaded. Rendering `children` bare until then would change the
 * element type at this position and remount the entire tree, re-running every
 * mount effect below it and double-firing the tool funnel's first step.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PostHog>(getPostHog)

  useEffect(() => {
    let cancelled = false

    loadPostHog().then((posthog) => {
      // Swapping the client re-renders consumers of `usePostHog()` with the
      // real instance. Queued calls have already been replayed by this point.
      if (!cancelled && posthog) setClient(posthog)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return <PHProvider client={client}>{children}</PHProvider>
}
