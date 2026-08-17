import { ogContentType, ogSize, toolOgAlt, toolOgImage } from '@/lib/og'

/** Social card for this tool. Copy comes from FREE_TOOLS — see lib/og.tsx. */
const HREF = '/credit-card-payoff'

export const alt = toolOgAlt(HREF)
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return toolOgImage(HREF)
}
