import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { FREE_TOOLS } from './tools'

/**
 * The registry drives the /tools grid, the footer, the sitemap and the
 * homepage, so a mistake here is visible on every surface at once.
 *
 * Icons in particular went wrong quietly. There were seven assets for nine
 * tools, and the two repeats landed side by side in the first row of the grid
 * — two identical rockets on Money Plan and First Paycheck Setup — which is
 * the kind of thing that survives review because nobody diffs a screenshot.
 */
describe('FREE_TOOLS', () => {
  it('gives every tool its own icon', () => {
    const byIcon = new Map<string, string[]>()
    FREE_TOOLS.forEach((t) => byIcon.set(t.icon, [...(byIcon.get(t.icon) ?? []), t.name]))

    const shared = [...byIcon.entries()].filter(([, tools]) => tools.length > 1)
    expect(shared.map(([icon, tools]) => `${icon} -> ${tools.join(', ')}`)).toEqual([])
  })

  it('points every icon at a file that exists', () => {
    const missing = FREE_TOOLS.filter(
      (t) => !existsSync(path.join(process.cwd(), 'public', t.icon)),
    ).map((t) => `${t.name}: ${t.icon}`)

    expect(missing).toEqual([])
  })

  it('keeps slugs and hrefs unique', () => {
    expect(new Set(FREE_TOOLS.map((t) => t.slug)).size).toBe(FREE_TOOLS.length)
    expect(new Set(FREE_TOOLS.map((t) => t.href)).size).toBe(FREE_TOOLS.length)
  })
})
