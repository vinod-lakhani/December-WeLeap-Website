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

/** Route of the sitewide card. Resolves against `metadataBase`. */
export const DEFAULT_OG_IMAGE = '/opengraph-image'

/** Facebook's and X's large-card size. */
export const OG_SIZE = { width: 1200, height: 630 }

export const OG_CONTENT_TYPE = 'image/png'
