'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { getPostHog } from '@/lib/posthog-lazy'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // One $pageview per URL. Not keyed on usePostHog(): the provider swaps the stub for the real client once the SDK
  // loads, which re-ran this effect and sent every first pageview twice. getPostHog() queues until then.
  useEffect(() => {
    if (pathname) {
      let url = window.location.origin + pathname
      const search = searchParams.toString()
      if (search) url += `?${search}`
      getPostHog().capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams])

  return null
}
