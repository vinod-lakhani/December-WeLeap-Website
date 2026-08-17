import { defaultOgAlt, defaultOgImage, ogContentType, ogSize } from '@/lib/og'

/**
 * Sitewide default social card. Any route that does not ship its own
 * `opengraph-image` inherits this one, which is what stops shared links
 * rendering as a bare text stub.
 */
export const alt = defaultOgAlt
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return defaultOgImage()
}
