import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The second-offer comparison renders as one DOM in two layouts: stacked on a
 * phone, two columns on a wide screen. These pin the two ways that could
 * quietly go wrong.
 *
 * The first is duplication. The obvious way to build "a phone tree and a
 * desktop tree" is two copies toggled with `hidden` / `lg:hidden`, which
 * mounts every `cmp-*` input twice; a page with two `#cmp-salary` has a label
 * that points at the first and a user typing into the second.
 *
 * The second is the funnel. `offer_compare_confirmed` used to mean a button
 * press; on a wide screen there is no button, so it fires when the live table
 * fills in instead. Both paths must still emit it, or the started → confirmed
 * step silently drops every laptop visitor.
 */

const src = readFileSync(join(process.cwd(), 'components/OfferCompare.tsx'), 'utf8')
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('OfferCompare: one DOM, two layouts', () => {
  it('mounts every second-offer input once', () => {
    const ids = [...code.matchAll(/id="(cmp-[a-z-]+)"/g)].map((m) => m[1])
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes, `duplicate ids: ${dupes.join(', ')}`).toEqual([])
    expect(ids).toContain('cmp-salary')
  })

  it('reports a confirmed comparison from both layouts', () => {
    const confirmed = [...code.matchAll(/track\('offer_compare_confirmed',\s*\{[^}]*layout:\s*'([a-z_]+)'/g)].map(
      (m) => m[1]
    )
    expect(confirmed.sort()).toEqual(['side_by_side', 'stacked'])
  })

  it('keeps the confirm button off wide screens, where nothing vanishes', () => {
    // The button exists so the intake panel does not disappear mid-fill on a
    // phone. On a wide screen the panel is always on screen, so the button
    // would be a second way to do nothing.
    const btn = /Compare the two offers →[\s\S]{0,400}?<\/button>|<button[\s\S]{0,600}?Compare the two offers →/.exec(code)
    expect(btn).not.toBeNull()
    expect(btn![0]).toMatch(/lg:hidden/)
  })
})
