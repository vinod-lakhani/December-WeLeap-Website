'use client'

import { useEffect } from 'react'
import { loadOpenAIPixel } from '@/lib/openai-pixel'

/**
 * Mounts the ChatGPT Ads Measurement Pixel site-wide so it sees the landing
 * URL and captures the `oppref` click parameter on arrival, before any
 * conversion fires. The loader lives in lib/openai-pixel.ts so events fired
 * during hydration queue rather than drop. Inert off the production host.
 *
 * No per-route page view: the SDK does not define one, and attribution is on
 * the conversion events in lib/openai-pixel.ts.
 */
export function OpenAIPixel() {
  useEffect(() => {
    loadOpenAIPixel()
  }, [])

  return null
}
