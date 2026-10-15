import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Tests for the build guard, which is not a normal thing to need.
 *
 * The guard discovers its own work by walking the prerendered output, so a
 * route that stops prerendering stops being checked — silently. That is how
 * three of the ten calculators, including both pages every paid campaign
 * points at, dropped out of the checked set when campaign mode taught them to
 * read `searchParams`. Nothing failed; the build just quietly checked less.
 *
 * The reconciliation step closes that. These tests close the next hole along:
 * the escape hatch it needed. `DYNAMIC_ROUTES` is a list of routes allowed to
 * skip the disk check, and the cheapest way to make a red build green is to
 * add a route to it with `invariants: false`. That would restore exactly the
 * silence the guard was rewritten to remove, and it would look like a fix.
 *
 * So: a route that is a public calculator may be declared dynamic, but it may
 * not be declared uncheckable.
 */

const script = () => readFileSync(join(process.cwd(), 'scripts/checkMetadata.js'), 'utf8')

/** The DYNAMIC_ROUTES block, parsed into { route: invariants }. */
function declaredDynamicRoutes(): Record<string, boolean> {
  const src = script()
  const block = src.match(/const DYNAMIC_ROUTES = \{([\s\S]*?)\n\}/)
  expect(block, 'DYNAMIC_ROUTES block not found — did the guard get rewritten?').toBeTruthy()

  const out: Record<string, boolean> = {}
  for (const entry of block![1].matchAll(/'([^']+)':\s*\{([\s\S]*?)\},/g)) {
    out[entry[1]] = /invariants:\s*true/.test(entry[2])
  }
  return out
}

/** Tool routes, from the list that drives the sitemap, footer and /tools. */
function toolRoutes(): string[] {
  const src = readFileSync(join(process.cwd(), 'lib/tools.ts'), 'utf8')
  return [...src.matchAll(/href:\s*["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((href) => href.startsWith('/') && !href.startsWith('/tools'))
}

describe('the guard cannot be quietly narrowed', () => {
  it('reconciles routes against the manifest rather than trusting the output dir', () => {
    const src = script()
    expect(src).toContain('app-path-routes-manifest.json')
    expect(src).toMatch(/undeclared/)
    // Must actually fail, not warn: a warning in postbuild output is a warning
    // nobody reads.
    expect(src).toMatch(/process\.exit\(1\)/)
  })

  it('declares every dynamic route with a reason', () => {
    const block = script().match(/const DYNAMIC_ROUTES = \{([\s\S]*?)\n\}/)![1]
    const routes = Object.keys(declaredDynamicRoutes())
    expect(routes.length).toBeGreaterThan(0)
    for (const route of routes) {
      const entry = block.match(new RegExp(`'${route.replace(/[[\]]/g, '\\$&')}':\\s*\\{([\\s\\S]*?)\\},`))
      expect(entry![1], `${route} has no reason`).toMatch(/reason:\s*'[^']{10,}'/)
    }
  })

  it('never lets a public calculator opt out of the invariants', () => {
    const declared = declaredDynamicRoutes()
    const tools = toolRoutes()
    expect(tools.length).toBeGreaterThanOrEqual(10)

    for (const [route, checked] of Object.entries(declared)) {
      if (!tools.includes(route)) continue
      expect(
        checked,
        `${route} is a calculator in lib/tools.ts declared with invariants:false. ` +
          `A tool page ranks and is shared, so it may be dynamic but it may not be unchecked. ` +
          `Set invariants:true and verify it with CHECK_METADATA_URL.`
      ).toBe(true)
    }
  })

  it('still verifies the dynamic tools over HTTP when given a deployment', () => {
    const src = script()
    expect(src).toContain('CHECK_METADATA_URL')
    expect(src).toMatch(/verifyOverHttp/)
    // A non-200 has to be a failure. Treating it as "could not check" would
    // turn a broken deploy into a pass.
    expect(src).toMatch(/res\.ok/)
  })

  it('keeps the four invariants in one place, used by both paths', () => {
    const src = script()
    expect(src).toMatch(/function checkHtml\(/)
    // Disk path and HTTP path must share it, or they drift.
    expect((src.match(/checkHtml\(/g) || []).length).toBeGreaterThanOrEqual(3)
  })
})
