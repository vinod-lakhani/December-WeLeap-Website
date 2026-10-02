'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { fbq } from '@/lib/meta-pixel'

/**
 * Mounts the Meta Pixel site-wide and fires PageView on every route, including
 * in-site (client-side) navigation, which a load-time-only PageView misses.
 * The loader itself lives in lib/meta-pixel.ts so /get can fire its event
 * regardless of effect order. Inert when NEXT_PUBLIC_META_PIXEL_ID is unset.
 */
export function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) fbq('track', 'PageView')
  }, [pathname])

  return null
}
