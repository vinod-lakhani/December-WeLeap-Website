import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { toolByHref } from '@/lib/structured-data'
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-image'

/**
 * The shared Open Graph card.
 *
 * Every shared link used to render as a bare text stub: the root layout asked
 * for `summary_large_image` but no image was ever set, and there was no
 * `opengraph-image` file anywhere. This is the one card design, rendered at
 * request time by Next's ImageResponse, reused by the sitewide default and by
 * each tool route.
 *
 * Deliberately no stats, ratings, user counts or logos-of-companies strip.
 * Nothing on the card is a claim that is not already true and visible on the
 * page it belongs to.
 *
 * Type note: satori (what ImageResponse renders with) supports a subset of CSS
 * — flexbox, no grid, every element that has more than one child must declare
 * `display: flex`. Keep changes inside that subset.
 */

export const ogSize = OG_SIZE

/**
 * The portrait card people actually post.
 *
 * 1080x1350 is Instagram's 4:5 — the tallest ratio a feed post accepts, so it
 * fits exactly there and merely letterboxes in Stories. 9:16 is the reverse
 * trade: exact in Stories, cropped hard in feed, and awkward in the other
 * places the share sheet reaches (WhatsApp, iMessage, Slack). 4:5 is the one
 * that is never wrong.
 *
 * The width matters as much as the ratio. Instagram wants 1080 and upscales
 * anything narrower, which is the other half of why the previous card looked
 * soft: it was an html2canvas screenshot of a 400px popover.
 */
export const shareSize = { width: 1080, height: 1350 }
export const ogContentType = OG_CONTENT_TYPE

/** Brand tokens, mirrored from tailwind.config.ts. */
const BRAND_700 = '#2d6a4f'
const BRAND_900 = '#163a29'
const LIME = '#a7c957'

interface CardProps {
  /** Small line above the headline — the tool name, or the product name. */
  eyebrow: string
  /** The card's one big line. For a tool, the question a visitor is asking. */
  headline: string
  /** One supporting line along the bottom. */
  footnote: string
}

function OgCard({ eyebrow, headline, footnote, portrait = false }: CardProps & { portrait?: boolean }) {
  /**
   * One composition, two shapes. The portrait card is not a different design —
   * same wordmark, eyebrow, headline and footnote in the same order — it just
   * has more vertical room and less horizontal, so the headline goes up and
   * the measure comes in.
   */
  const t = portrait
    ? { pad: '84px 72px', wordmark: 38, eyebrow: 26, headline: 82, footnote: 30, measure: 940 }
    : { pad: '68px 76px', wordmark: 34, eyebrow: 24, headline: 72, footnote: 27, measure: 1000 }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: t.pad,
        backgroundColor: BRAND_700,
        backgroundImage: `linear-gradient(135deg, ${BRAND_700} 0%, ${BRAND_900} 100%)`,
        color: '#ffffff',
        fontFamily: 'Plus Jakarta Sans',
      }}
    >
      {/* Wordmark row */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: LIME,
            marginRight: 14,
          }}
        />
        <div style={{ fontSize: t.wordmark, fontWeight: 800, letterSpacing: '-0.5px' }}>WeLeap</div>
      </div>

      {/* The question */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: t.measure }}>
        <div
          style={{
            fontSize: t.eyebrow,
            fontWeight: 600,
            letterSpacing: '2.6px',
            textTransform: 'uppercase',
            color: LIME,
            marginBottom: 22,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: t.headline,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-2px',
          }}
        >
          {headline}
        </div>
      </div>

      {/* Supporting line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: t.footnote,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        {footnote}
      </div>
    </div>
  )
}

/**
 * Plus Jakarta Sans, bundled rather than fetched.
 *
 * satori ships one fallback face and it has no bold, so without this the
 * headline renders at regular weight — the card ends up in a typeface the site
 * does not use, at a weight it never sets. These are the two weights the card
 * needs, as static latin-subset instances (~63KB each).
 *
 * Read off disk rather than fetched. Next's documented `fetch(new URL(...,
 * import.meta.url))` pattern is edge-runtime only; under the Node runtime that
 * resolves to a file:// URL, which fetch refuses, and every one of these eight
 * routes fails to prerender. Fetching the font from Google instead would put a
 * network call inside the build.
 *
 * `process.cwd()` is safe here because all eight opengraph-image routes are
 * statically prerendered — this runs at build time, in the project root, and
 * the PNGs are served as static files afterwards. If one of these ever gains a
 * dynamic segment, the font would need tracing into the serverless bundle.
 *
 * Plus Jakarta Sans is SIL Open Font License, so redistributing it is fine.
 */
const FONT_DIR = path.join(process.cwd(), 'lib', 'fonts')

const FONT_FILES = [
  { file: 'PlusJakartaSans-SemiBold.ttf', weight: 600 as const },
  { file: 'PlusJakartaSans-ExtraBold.ttf', weight: 800 as const },
]

/**
 * Read on first render, not on import — and this is load-bearing, not tidiness.
 *
 * These two lines used to run at module scope. Next imports an
 * `opengraph-image` module to read its `size`, `contentType` and `alt` exports
 * while generating the PAGE's metadata, so importing this module is something
 * a plain page render does, and the disk read went with it. For the eight
 * prerendered tool cards that is harmless: it happens at build time, in the
 * project root, where the files exist.
 *
 * The share route is dynamic. In a serverless bundle the .ttf files are only
 * present if something traced them in, so the read threw ENOENT during
 * metadata generation and BOTH the page and its image returned 500 — while
 * working perfectly in dev, because dev runs from the project root.
 *
 * Deferring it means importing this module is free. Only a route that actually
 * draws a card touches the disk, and if the fonts are missing the failure is
 * confined to the image rather than taking the page down with it.
 */
let cachedFonts: { name: string; data: Buffer; weight: 600 | 800; style: 'normal' }[] | null = null

function loadFonts() {
  if (!cachedFonts) {
    cachedFonts = FONT_FILES.map(({ file, weight }) => ({
      name: 'Plus Jakarta Sans',
      data: readFileSync(path.join(FONT_DIR, file)),
      weight,
      style: 'normal' as const,
    }))
  }
  return cachedFonts
}

function render(props: CardProps) {
  return new ImageResponse(<OgCard {...props} />, { ...ogSize, fonts: loadFonts() })
}

/**
 * The 4:5 card the Share and Download buttons hand over.
 *
 * Rendered by the same component as the link preview, so the image someone
 * posts and the card a platform draws from the URL cannot drift apart — they
 * were previously two separate designs, one of them a screenshot.
 */
export function shareCardImage({
  eyebrow,
  headline,
  footnote,
}: {
  eyebrow: string
  headline: string
  footnote: string
}) {
  return new ImageResponse(<OgCard portrait eyebrow={eyebrow} headline={headline} footnote={footnote} />, {
    ...shareSize,
    fonts: loadFonts(),
  })
}

/** The sitewide default card, used by `app/opengraph-image.tsx`. */
export function defaultOgImage() {
  return render({
    eyebrow: 'Your AI financial sidekick',
    headline: 'One clear money move at a time.',
    footnote: 'weleap.ai',
  })
}

export const defaultOgAlt = 'WeLeap — one clear money move at a time.'

/**
 * A tool's card. Text is read out of FREE_TOOLS (via `toolByHref`) so a card
 * cannot drift from the question printed on the tool's own page, and a new
 * tool only needs its four-line `opengraph-image.tsx` stub.
 */
export function toolOgImage(href: string) {
  const tool = toolByHref(href)
  if (!tool) return defaultOgImage()
  return render({
    eyebrow: tool.name,
    headline: tool.question,
    footnote: 'Free · No account · No email wall',
  })
}

/**
 * A shared claim's card.
 *
 * Unlike the eight tool cards this is NOT statically prerendered — the claim
 * is a dynamic path segment, so this renders per request. See the note on
 * FONT_DIR above: the fonts have to be traced into the serverless bundle for
 * this route, which is what the `outputFileTracingIncludes` entry in
 * next.config.mjs is for. Without it the read succeeds locally and fails in
 * production, which is the worst shape a bug can take.
 */
export function claimOgImage({
  eyebrow,
  headline,
  footnote,
}: {
  eyebrow: string
  headline: string
  footnote: string
}) {
  // The eyebrow names what the reader is looking at rather than the tool: this
  // card is seen in a feed by people who have never heard of WeLeap.
  return render({ eyebrow, headline, footnote })
}

/** The `alt` export for a tool route's opengraph-image. */
export function toolOgAlt(href: string) {
  const tool = toolByHref(href)
  return tool ? `${tool.name} — ${tool.question}` : defaultOgAlt
}
