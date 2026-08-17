import { ogContentType, ogSize, toolOgAlt, toolOgImage } from '@/lib/og'

/** Social card for this tool. Copy comes from FREE_TOOLS — see lib/og.tsx. */
const HREF = '/should-i-use-buy-now-pay-later'

export const alt = toolOgAlt(HREF)
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return toolOgImage(HREF)
}
