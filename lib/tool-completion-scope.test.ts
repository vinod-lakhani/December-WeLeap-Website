import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { FREE_TOOLS } from './tools'

/**
 * Every tool's completion is session-scoped.
 *
 * A `useRef` guard is per MOUNT: someone who works out their answer, refreshes
 * and edits again produces two completions, and cost per account divides by
 * that number. Offer and rent were moved to `claimToolCompletion` on 10 Oct;
 * the other eight kept their refs until 18 Oct, which meant the same event
 * meant different things depending on which tool emitted it — and the whole
 * argument for one definition is that the tools are read against each other.
 *
 * This test exists because that drift happened once already and was invisible:
 * nothing failed, the numbers were just quietly wrong for eight of ten tools.
 * It reads source rather than behaviour, which is weaker than driving the page
 * — so it pins the one thing source can prove, that no tool fires
 * `tool_completed` outside a session claim.
 */

const COMPONENTS = join(process.cwd(), 'components')

/** Files that emit tool_completed, found by reading rather than by a list. */
function filesEmittingCompletion(): string[] {
  return execSync(`grep -rl "track('tool_completed'" ${COMPONENTS}`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
}

describe('tool_completed is session-scoped everywhere', () => {
  it('finds a tool_completed emitter for most registered tools', () => {
    // A sanity floor: if this collapses, the grep above has stopped matching
    // and every assertion below would pass vacuously.
    expect(filesEmittingCompletion().length).toBeGreaterThanOrEqual(8)
    expect(FREE_TOOLS.length).toBeGreaterThanOrEqual(10)
  })

  it('never fires outside a claimToolCompletion gate', () => {
    for (const file of filesEmittingCompletion()) {
      const src = readFileSync(file, 'utf8')
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

      expect(
        code.includes('claimToolCompletion('),
        `${file.split('/').pop()} emits tool_completed without claiming the session. ` +
          `A useRef guard is per mount, so a reload double-counts. See lib/tool-funnel.ts.`
      ).toBe(true)

      // Every emission must sit inside a claim, not merely somewhere in the file.
      for (const match of code.matchAll(/track\('tool_completed'/g)) {
        const before = code.slice(Math.max(0, match.index! - 400), match.index!)
        expect(
          before.includes('claimToolCompletion('),
          `${file.split('/').pop()}: a tool_completed call is not inside a claim block.`
        ).toBe(true)
      }
    }
  })

  it('claims under the slug the event reports, so the two cannot drift', () => {
    for (const file of filesEmittingCompletion()) {
      const code = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')

      const claimed = [...code.matchAll(/claimToolCompletion\('([a-z_]+)'\)/g)].map((m) => m[1])
      const reported = [...code.matchAll(/track\('tool_completed',\s*\{[\s\S]{0,200}?tool:\s*'([a-z_]+)'/g)].map(
        (m) => m[1]
      )
      for (const slug of reported) {
        expect(
          claimed.includes(slug),
          `${file.split('/').pop()}: reports tool "${slug}" but claims ${JSON.stringify(claimed)}. ` +
            `A mismatched slug means the session guard protects a different tool than the one counted.`
        ).toBe(true)
      }
    }
  })
})
