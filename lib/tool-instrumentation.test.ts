import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FREE_TOOLS } from './tools'

/**
 * Guards the cross-tool funnel.
 *
 * Every marketing tool has to emit `tool_completed` and `tool_cta_clicked` with
 * its canonical slug, or it silently vanishes from the GTM funnel — the tool
 * still works, the dashboard just stops counting it. That failure is invisible
 * in review and only shows up as a suspiciously flat funnel weeks later.
 *
 * This reads the source rather than rendering the tools. It cannot prove the
 * events fire at the right moment — only a browser can do that — but it does
 * prove no tool was added without wiring them at all, which is the drift that
 * actually happens.
 */

const COMPONENTS = join(process.cwd(), 'components')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry) && !/\.test\./.test(entry) ? [full] : []
  })
}

const SOURCE = sourceFiles(COMPONENTS)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

describe('cross-tool funnel instrumentation', () => {
  it.each(FREE_TOOLS.map((t) => [t.slug, t.name]))(
    '%s (%s) fires tool_completed with its canonical slug',
    (slug) => {
      const fires = new RegExp(
        `track\\(\\s*['"]tool_completed['"]\\s*,\\s*\\{[^}]*tool:\\s*['"]${slug}['"]`
      ).test(SOURCE)
      expect(fires, `no tool_completed fire site found for "${slug}"`).toBe(true)
    }
  )

  it.each(FREE_TOOLS.map((t) => [t.slug, t.name]))(
    '%s (%s) reaches tool_cta_clicked, inline or through AppCta',
    (slug) => {
      const inline = new RegExp(
        `track\\(\\s*['"]tool_cta_clicked['"]\\s*,\\s*\\{[^}]*tool:\\s*['"]${slug}['"]`
      ).test(SOURCE)
      // AppCta fires the event itself, so passing the slug to it is sufficient.
      const viaAppCta = new RegExp(`tool=["']${slug}["']`).test(SOURCE)
      expect(
        inline || viaAppCta,
        `"${slug}" neither fires tool_cta_clicked inline nor passes tool= to AppCta`
      ).toBe(true)
    }
  )

  it.each(FREE_TOOLS.map((t) => [t.slug, t.name]))(
    '%s (%s) fires tool_result_shown with its canonical slug',
    (slug) => {
      /**
       * The companion to tool_completed, and the reason completion could be
       * given one definition across every tool.
       *
       * Completion now means "a result is on screen AND the visitor did
       * something", which is narrower than what several tools used to report.
       * The moment those tools were reporting — a result rendered, whoever put
       * it there — is real and still wanted, so it has its own event rather
       * than being dropped or left overloaded. A tool that emits one and not
       * the other cannot be read alongside the rest.
       */
      const viaHook = new RegExp(`useResultShown\\(\\s*['"]${slug}['"]`).test(SOURCE)
      const inline = new RegExp(
        `track\\(\\s*['"]tool_result_shown['"]\\s*,\\s*\\{[^}]*tool:\\s*['"]${slug}['"]`
      ).test(SOURCE)
      expect(
        viaHook || inline,
        `no tool_result_shown fire site found for "${slug}"`
      ).toBe(true)
    }
  )

  it('no tool completes on a scroll or a page view', () => {
    /**
     * The two gates that make a tool's completions uncomparable to everyone
     * else's, both of which existed here:
     *
     * - the loan tool completed when the advice card was scrolled to, on a
     *   page that computes from defaults, so reading counted as answering;
     * - the offer tool completed when a tax lookup resolved, which campaign
     *   sessions never trigger, so they could not complete at all.
     */
    const loan = readFileSync(join(COMPONENTS, 'FirstLoanPaymentTool.tsx'), 'utf8')
    expect(loan).toMatch(/if \(result && engagementCount > 0\) complete\(\)/)
    expect(loan).toMatch(/track\('tool_advice_reached'/)

    const offer = readFileSync(join(COMPONENTS, 'OfferAnalysisTool.tsx'), 'utf8')
    expect(offer).toMatch(/const analysisComplete = hasResults && fieldChangeCount > 0;/)
  })

  it('every tool_completed slug is a registered tool', () => {
    const known = new Set(FREE_TOOLS.map((t) => t.slug))
    const emitted = [
      ...SOURCE.matchAll(
        /track\(\s*['"]tool_completed['"]\s*,\s*\{[^}]*tool:\s*['"]([a-z_]+)['"]/g
      ),
    ].map((m) => m[1])
    const orphans = [...new Set(emitted)].filter((s) => !known.has(s))
    expect(orphans, `slugs emitted but not in FREE_TOOLS: ${orphans.join(', ')}`).toEqual([])
  })
})
