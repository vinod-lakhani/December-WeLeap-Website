import { ogContentType, ogSize, toolsHubOgAlt, toolsHubOgImage } from '@/lib/og'

/**
 * Social card for the tools hub.
 *
 * Unlike the ten leaf routes this cannot call `toolOgImage(href)` — /tools is
 * the index, not an entry in FREE_TOOLS — so the copy lives in lib/og.tsx
 * beside the shared card design rather than here.
 */
export const alt = toolsHubOgAlt
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return toolsHubOgImage()
}
