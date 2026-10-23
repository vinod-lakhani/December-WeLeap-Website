/**
 * Postbuild metadata assertions.
 *
 * These run against the *built HTML*, not the metadata objects, because every
 * defect this file exists to catch was invisible in config and visible in
 * rendered output. `openGraph.title` looks correct in a page's source right up
 * until the root layout's `%s | WeLeap` template appends a suffix to `title`
 * and not to it.
 *
 * Four invariants, chosen because each has actually regressed on this repo:
 *
 *  1. `<title>` and `og:title` byte-identical. Broken three times — twice by a
 *     hand-written brand suffix, once by a branch cut before the sweep that
 *     fixed it everywhere else.
 *  2. Every page emits `og:image`. Broken when two tool routes shipped without
 *     an `opengraph-image.tsx`, so links to the site's most shareable pages
 *     previewed as bare text.
 *  3. Exactly one `<h1>` per page. Broken when a page's h1 sat inside a
 *     Suspense boundary whose fallback was a skeleton, so the served HTML had
 *     none at all.
 *  4. Every calculator carries the full FAQ set. Broken three times running —
 *     each of the last three tools shipped with five entries where the rest
 *     have seven.
 *
 * WHY THERE IS NOW A ROUTE RECONCILIATION STEP. This script used to discover
 * its own work by walking `.next/server/app/**\/*.html`, which silently equates
 * "page I could not find" with "page that is fine". A route that reads
 * `searchParams` is dynamic, emits no prerendered HTML, and was therefore
 * skipped on all four invariants without a word.
 *
 * That was not hypothetical. When campaign mode taught the offer, rent and
 * first-paycheck tools to read `searchParams`, three of the ten calculators —
 * including the two every paid campaign points at — dropped out of the checked
 * set and nothing said so. The pattern this file's own header describes ("what
 * the build checks gets done, and what it does not check drifts") had started
 * applying to the checker itself.
 *
 * So the set of routes is now taken from Next's own manifest rather than from
 * whatever happened to land on disk, and any page route without prerendered
 * output must be declared below with a reason. An undeclared one fails the
 * build. A declaration that stops being true also fails, so the list cannot
 * quietly rot into a list of excuses.
 *
 * A calculator is identified by emitting `WebApplication` schema rather than by
 * a route list, so a tool added tomorrow is covered without touching this file.
 *
 * Add an invariant here when something breaks, not in anticipation. A check
 * that has never caught anything is a check nobody trusts.
 */

const { readdirSync, readFileSync, existsSync } = require('node:fs')
const { join, relative } = require('node:path')

const APP_DIR = join(process.cwd(), '.next', 'server', 'app')
const ROUTES_MANIFEST = join(process.cwd(), '.next', 'app-path-routes-manifest.json')

/**
 * Next's own 404: no og:title (it inherits the root) and no h1, both correctly.
 */
const EXEMPT_PRERENDERED = new Set(['_not-found.html'])

/**
 * Page routes that legitimately emit no prerendered HTML, with the reason.
 *
 * `invariants: true` means the page is still public and still has to satisfy
 * the four checks — it just cannot be read off disk, so it is verified over
 * HTTP when CHECK_METADATA_URL points at a deployment and reported as
 * unverified when it does not. These are the three calculators that went
 * dynamic for campaign mode; they rank and they are shared, so exempting them
 * outright would be how the next regression ships.
 *
 * `invariants: false` is for routes where the checks genuinely do not apply:
 * noindex, not shared, no h1 by design.
 */
const DYNAMIC_ROUTES = {
  '/what-is-my-job-offer-worth': {
    reason: 'campaign mode reads searchParams',
    invariants: true,
  },
  '/how-much-rent-can-i-afford': {
    reason: 'campaign mode reads searchParams',
    invariants: true,
  },
  '/first-paycheck-setup': {
    reason: 'campaign mode reads searchParams',
    invariants: true,
  },
  '/rent_text': {
    reason: 'text-pilot paid landing; campaign mode reads searchParams; robots:noindex',
    invariants: true,
  },
  '/offer_text': {
    reason: 'text-pilot paid landing; campaign mode reads searchParams; robots:noindex',
    invariants: true,
  },
  '/get': {
    reason: 'reads headers() for device and searchParams for UTMs; robots:noindex',
    invariants: false,
  },
  '/bio': {
    reason: 'reads searchParams for src/utm; robots:noindex',
    invariants: false,
  },
  '/s/[tool]/[claim]': {
    reason: 'parameterised share route, rendered per claim; robots:noindex',
    invariants: false,
  },
}

/**
 * FAQ entries every calculator carries. Not an arbitrary target — it is the
 * count the whole set was brought to, and the number the newest tool is
 * measured against so the set stays uniform. Raising it means raising it
 * everywhere.
 */
const MIN_TOOL_FAQ = 7

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

/** The four invariants, against one page's served HTML. */
function checkHtml(route, html) {
  const failures = []

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

  // Calculators only. A page emitting WebApplication is a tool by definition,
  // which keeps this from needing a route list that would go stale.
  if (html.includes('"@type":"WebApplication"')) {
    const faqs = (html.match(/"@type":"Question"/g) || []).length
    if (faqs < MIN_TOOL_FAQ) {
      failures.push(
        `${route}\n    ${faqs} FAQ entries, expected at least ${MIN_TOOL_FAQ}.\n` +
        `    Add them to this route's key in lib/tool-faqs.ts — the page and the\n` +
        `    FAQPage schema both read that array, so they stay in step.`
      )
    }
  }

  return failures
}

/** Every app *page* route Next built, from its own manifest. */
function manifestPageRoutes() {
  const manifest = JSON.parse(readFileSync(ROUTES_MANIFEST, 'utf8'))
  return Object.entries(manifest)
    .filter(([key]) => key.endsWith('/page'))
    .map(([, route]) => route)
}

async function verifyOverHttp(routes, baseUrl) {
  const failures = []
  for (const route of routes) {
    const url = new URL(route, baseUrl).toString()
    let html
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) {
        failures.push(`${route}\n    ${res.status} from ${url} — cannot verify a route that does not serve.`)
        continue
      }
      html = await res.text()
    } catch (err) {
      failures.push(`${route}\n    fetch failed for ${url}: ${err.message}`)
      continue
    }
    failures.push(...checkHtml(route, html))
  }
  return failures
}

async function main() {
  if (!existsSync(APP_DIR)) {
    console.error(`[checkMetadata] ${APP_DIR} not found — expected to run after \`next build\`.`)
    process.exit(1)
  }
  if (!existsSync(ROUTES_MANIFEST)) {
    console.error(`[checkMetadata] ${ROUTES_MANIFEST} not found — expected to run after \`next build\`.`)
    process.exit(1)
  }

  const failures = []
  const files = htmlFiles(APP_DIR)

  const prerendered = new Set(
    files.map((f) => '/' + relative(APP_DIR, f).replace(/\.html$/, '').replace(/^index$/, ''))
  )

  /* ── Reconcile: nothing may be skipped without saying so ──────────────── */

  const routes = manifestPageRoutes()
  const undeclared = routes.filter((r) => !prerendered.has(r) && !(r in DYNAMIC_ROUTES))
  for (const route of undeclared) {
    failures.push(
      `${route}\n    built no prerendered HTML, so none of the four invariants ran on it.\n` +
      `    This is usually a server component newly reading searchParams, headers()\n` +
      `    or cookies(). Either keep the route static, or declare it in\n` +
      `    DYNAMIC_ROUTES in this file with a reason — and set invariants:true if\n` +
      `    the page is public, so it is verified over HTTP instead of skipped.`
    )
  }

  // A declaration that is no longer true is how the list rots into excuses.
  for (const route of Object.keys(DYNAMIC_ROUTES)) {
    if (prerendered.has(route)) {
      failures.push(
        `${route}\n    is declared in DYNAMIC_ROUTES but now prerenders fine.\n` +
        `    Remove the entry so the route is checked off disk like every other page.`
      )
    } else if (!routes.includes(route)) {
      failures.push(
        `${route}\n    is declared in DYNAMIC_ROUTES but is not a route any more.\n` +
        `    Remove the entry.`
      )
    }
  }

  /* ── The four invariants, on everything that landed on disk ───────────── */

  for (const file of files) {
    const name = relative(APP_DIR, file)
    if (EXEMPT_PRERENDERED.has(name)) continue
    const route = '/' + name.replace(/\.html$/, '').replace(/^index$/, '')
    failures.push(...checkHtml(route, readFileSync(file, 'utf8')))
  }

  /* ── Dynamic routes that still have to pass, verified over HTTP ───────── */

  const needRuntime = Object.entries(DYNAMIC_ROUTES)
    .filter(([route, d]) => d.invariants && !prerendered.has(route))
    .map(([route]) => route)

  const baseUrl = process.env.CHECK_METADATA_URL
  let verified = 0
  if (needRuntime.length && baseUrl) {
    failures.push(...(await verifyOverHttp(needRuntime, baseUrl)))
    verified = needRuntime.length
  }

  if (failures.length) {
    console.error(`\n[checkMetadata] ${failures.length} problem(s) across ${files.length} prerendered pages:\n`)
    for (const f of failures) console.error(`  ✗ ${f}\n`)
    process.exit(1)
  }

  console.log(
    `[checkMetadata] ${files.length} prerendered pages OK — title/og:title parity, og:image, single h1, FAQ coverage.`
  )
  if (verified) {
    console.log(`[checkMetadata] ${verified} dynamic route(s) verified against ${baseUrl}.`)
  } else if (needRuntime.length) {
    console.log(
      `[checkMetadata] ${needRuntime.length} dynamic route(s) NOT verified — they emit no\n` +
      `  prerendered HTML and CHECK_METADATA_URL is unset: ${needRuntime.join(', ')}\n` +
      `  Set CHECK_METADATA_URL to a running deployment to check them.`
    )
  }
}

main().catch((err) => {
  console.error(`[checkMetadata] ${err.stack || err.message}`)
  process.exit(1)
})
