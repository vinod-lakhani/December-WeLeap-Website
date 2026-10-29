/**
 * Plays every conversation (conversations.ts) through the real chat and reader, and reports what broke and where.
 *   RENTPILOT_URL=… RENTPILOT_KEY=… npx tsx scripts/ribbit-convo/run.ts <label>     ONLY=regex  RUNS=n
 * OFFLINE=1 stubs the reader (an echo), to check the scripts and the driver without a backend.
 * Run before every change to the chat (lib/ribbit) or the reader (backend ai/guest.go), with scripts/ribbit-eval.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { CONVERSATIONS } from './conversations'
import type { Played } from './driver'

async function main() {
  const label = process.argv[2] ?? 'run'
  if (process.env.OFFLINE === '1') {
    process.env.RENTPILOT_URL = 'http://offline.invalid'
    process.env.RENTPILOT_KEY = 'offline'
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.startsWith('http://offline.invalid')) {
        const body = JSON.parse(String(init?.body ?? '{}'))
        return new Response(JSON.stringify({ kind: 'question', reply: `(offline) about: ${body.message}`, plan: false }), { status: 200 })
      }
      return realFetch(input, init)
    }) as typeof fetch
  } else if (!process.env.RENTPILOT_URL || !process.env.RENTPILOT_KEY) {
    console.error('set RENTPILOT_URL and RENTPILOT_KEY (or OFFLINE=1)')
    process.exit(1)
  }
  const { play } = await import('./driver')
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null
  const runs = Number(process.env.RUNS ?? 1)
  const convos = CONVERSATIONS.filter((c) => !only || only.test(c.id))
  const results: Array<{ id: string; runs: Played[] }> = []
  for (const c of convos) {
    const played: Played[] = []
    for (let r = 1; r <= runs; r++) played.push(await play(c, r))
    results.push({ id: c.id, runs: played })
    const bad = played.filter((p) => p.failures.length)
    process.stdout.write(bad.length ? 'F' : '.')
  }
  process.stdout.write('\n\n')
  const failed = results.filter((r) => r.runs.some((p) => p.failures.length))
  console.log(`${label}: ${results.length - failed.length}/${results.length} conversations clean (${runs} run${runs > 1 ? 's' : ''} each)\n`)
  for (const r of failed) {
    console.log(`FAIL ${r.id}`)
    for (const [i, p] of r.runs.entries()) {
      for (const f of p.failures) console.log(`  run ${i + 1} [${f.rule}] at ${f.turn}: ${f.detail}`)
    }
    const p = r.runs.find((x) => x.failures.length)!
    for (const l of p.lines.slice(-8)) console.log(`    ${l.from === 'person' ? '>' : ' '} ${l.text.slice(0, 160)}${l.chips ? `   [${l.chips.join(' | ')}]` : ''}`)
    console.log('')
  }
  mkdirSync('scripts/ribbit-convo/runs', { recursive: true })
  writeFileSync(`scripts/ribbit-convo/runs/${label}.json`, JSON.stringify(results, null, 1))
  console.log(`wrote scripts/ribbit-convo/runs/${label}.json`)
}
main()
