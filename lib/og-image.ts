/**
 * Social-card constants, split out from lib/og.tsx so a page can import the
 * default card's path without dragging `next/og`'s ImageResponse into its
 * server bundle.
 *
 * Why pages need this at all: Next does NOT deep-merge `openGraph`. A route
 * that declares its own `openGraph` block replaces the parent's resolved
 * object wholesale, which drops the image inherited from the nearest
 * `opengraph-image` file. So the sitewide `app/opengraph-image.tsx` reaches
 * only the routes that declare no `openGraph` of their own — every other route
 * has to name the image explicitly. Confirmed against the built HTML: before
 * this constant existed, 17 routes shipped og:title and og:description with no
 * og:image at all.
 *
 * A tool route does not need this: it has its own `opengraph-image.tsx` in the
 * same segment, and a same-segment file does win.
 */

/** Facebook's and X's large-card size. */
export const OG_SIZE = { width: 1200, height: 630 }

export const OG_CONTENT_TYPE = 'image/png'

/**
 * The sitewide card, as a full image object rather than a bare path.
 *
 * It used to be just `'/opengraph-image'`. A route naming the image that way
 * emits `og:image` alone, while the tool routes — which get their image from a
 * same-segment `opengraph-image.tsx` file — emit width, height, type and alt
 * too, because Next fills those in from the file's exports. So `/about` and all
 * twelve articles were shipping a dimensionless card while the tools shipped a
 * complete one. Some crawlers skip an image with no declared dimensions on
 * first pass, which is the whole point of having a card.
 *
 * `url` still resolves against `metadataBase`.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: OG_SIZE.width,
  height: OG_SIZE.height,
  type: OG_CONTENT_TYPE,
  alt: 'WeLeap — free money tools that answer one question at a time',
}
