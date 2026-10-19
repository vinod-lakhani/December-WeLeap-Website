import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Three things that would quietly undo what this tool was built to avoid.
 *
 * No worked example. Every prefilled hero and example-driven tool on this site
 * has needed its completion gate repaired, because a result that exists before
 * anybody types makes "a result and a touch" mean nothing. The rate starts
 * empty here, and that is the whole gate.
 *
 * One DOM for both layouts of the comparison, so every `intern-*` input mounts
 * once: two `#intern-b-rate` would leave a label pointing at the one you are
 * not typing into.
 *
 * Completion needs a changed field, not a focused one — the rent tool counted
 * focus and completed on a tab through the form.
 */

const src = readFileSync(join(process.cwd(), 'components/InternshipOfferTool.tsx'), 'utf8')
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('InternshipOfferTool', () => {
  it('has no campaign mode and no example salary', () => {
    expect(code).not.toMatch(/campaign/i)
    expect(code).not.toMatch(/EXAMPLE/)
    // The only way a rate gets a value is the visitor typing one.
    expect(code).toMatch(/useState<InternshipInputs>\(emptyInternship\)/)
  })

  it('mounts every input once, across both comparison columns', () => {
    const ids = [...code.matchAll(/id=\{`\$\{p\}-([a-z-]+)`\}/g)].map((m) => m[1])
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes, `duplicate field ids: ${dupes.join(', ')}`).toEqual([])
    // The fields component is rendered exactly twice, with two prefixes.
    expect([...code.matchAll(/idPrefix="(intern(?:-b)?)"/g)].map((m) => m[1]).sort()).toEqual(['intern', 'intern-b'])
  })

  it('completes on pay plus one of term, state or city — all changes, never focus', () => {
    expect(code).toMatch(/changed\.has\('pay'\)\s*&&\s*\(changed\.has\('weeks'\)\s*\|\|\s*changed\.has\('state'\)\s*\|\|\s*changed\.has\('city'\)\)/)
    expect(code).not.toMatch(/onFocus=\{[^}]*(setChanged|patchA)/)
  })

  it('claims the session under the slug it reports', () => {
    expect(code).toMatch(/claimToolCompletion\('internship'\)/)
    expect(code).toMatch(/track\('tool_completed',\s*\{\s*tool:\s*'internship'/)
    expect(code).toMatch(/useResultShown\('internship'/)
    expect(code).toMatch(/tool="internship"/)
  })
})
