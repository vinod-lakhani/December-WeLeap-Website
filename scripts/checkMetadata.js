/**
 * Postbuild metadata assertions.
 *
 * These run against the *built HTML*, not the metadata objects, because every
 * defect this file exists to catch was invisible in config and visible in
 * rendered output. `openGraph.title` looks correct in a page's source right up
 * until the root layout's `%s | WeLeap` template appends a suffix to `title`
 * and not to it.
 *
 * Three invariants, chosen because each has actually regressed on this repo:
 *
 *  1. `<title>` and `og:title` byte-identical. Broken three times — twice by a
 *     hand-written brand suffix, once by a branch cut before the sweep that
 *     fixed it everywhere else.
 *  2. Every prerendered page emits `og:image`. Broken when two tool routes
 *     shipped without an `opengraph-image.tsx`, so links to the site's most
 *     shareable pages previewed as bare text.
 *  3. Exactly one `<h1>` per page. Broken when a page's h1 sat inside a
 *     Suspense boundary whose fallback was a skeleton, so the served HTML had
 *     none at all.
 *
 * Add an invariant here when something breaks, not in anticipation. A check
 * that has never caught anything is a check nobody trusts.
 */

const { readdirSync, readFileSync, existsSync } = require('node:fs')
const { join, relative } = require('node:path')

const APP_DIR = join(process.cwd(), '.next', 'server', 'app')

/**
 * Next's own 404. It has no og:title (inheriting the root's) and no h1, both
 * correctly — it is not a page anyone shares or ranks.
 */
const EXEMPT = new Set(['_not-found.html'])

function htmlFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...htmlFiles(full))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

const first = (html, re) => {
  const m = html.match(re)
  return m ? m[1] : null
}

function main() {
  if (!existsSync(APP_DIR)) {
    console.error(`[checkMetadata] ${APP_DIR} not found — expected to run after \`next build\`.`)
    process.exit(1)
  }

  const failures = []
  const files = htmlFiles(APP_DIR)

  for (const file of files) {
    const name = relative(APP_DIR, file)
    if (EXEMPT.has(name)) continue

    const html = readFileSync(file, 'utf8')
    const route = '/' + name.replace(/\.html$/, '').replace(/^index$/, '')

    const title = first(html, /<title>(.*?)<\/title>/s)
    const ogTitle = first(html, /property="og:title" content="(.*?)"/s)
    if (title && ogTitle && title !== ogTitle) {
      failures.push(
        `${route}\n    <title>  ${title}\n    og:title ${ogTitle}\n` +
        `    openGraph.title must match what \`title\` renders through the root template.`
      )
    }

    if (!/property="og:image"/.test(html)) {
      failures.push(
        `${route}\n    no og:image — the route needs an opengraph-image.tsx in its own\n` +
        `    segment, or DEFAULT_OG_IMAGE named in its openGraph.images.`
      )
    }

    // Strip scripts first: JSON-LD and RSC payloads contain escaped markup.
    const body = html.replace(/<script[\s\S]*?<\/script>/g, '')
    const h1s = (body.match(/<h1[\s>]/g) || []).length
    if (h1s !== 1) {
      failures.push(
        `${route}\n    ${h1s} <h1> elements, expected exactly 1.\n` +
        `    If it is 0, check whether the h1 is behind a Suspense boundary.`
      )
    }
  }

  if (failures.length) {
    console.error(`\n[checkMetadata] ${failures.length} problem(s) across ${files.length} prerendered pages:\n`)
    for (const f of failures) console.error(`  ✗ ${f}\n`)
    process.exit(1)
  }

  console.log(`[checkMetadata] ${files.length} prerendered pages OK — title/og:title parity, og:image, single h1.`)
}

main()
