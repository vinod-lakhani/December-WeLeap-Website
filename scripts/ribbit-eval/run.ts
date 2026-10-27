/**
 * Runs the Ribbit reader's test set (cases.ts) against a live reader and reports what failed and why.
 *
 *   npx tsx scripts/ribbit-eval/run.ts [label]
 *
 * Reads RENTPILOT_URL and RENTPILOT_KEY from the environment or .env.local (the same pair the site's
 * /api/ribbit-ask uses; the key is never printed). Results are written to scripts/ribbit-eval/runs/<label>.json,
 * which is git-ignored, so two runs (before and after a change) can be compared.
 *
 * Each case runs RUNS times (default 2): the reader is a model, so a case that passes once and fails once is
 * flaky, and is reported as a fail.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CASES as CORE, OFFER_RESULT, RENT_RESULT, SPLIT_ABBREVIATION, type Case, type Kind } from './cases'
import { GRAD_CASES } from './grad-questions'

const CASES: Case[] = [...CORE, ...GRAD_CASES]

function env(name: string): string {
  if (process.env[name]) return process.env[name] as string
  try {
    const line = readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n').find((l) => l.startsWith(`${name}=`))
    return line ? line.slice(name.length + 1).trim().replace(/^"|"$/g, '') : ''
  } catch {
    return ''
  }
}

const BASE = env('RENTPILOT_URL')
const KEY = env('RENTPILOT_KEY')
const RUNS = Number(process.env.RUNS ?? 2)
const LABEL = process.argv[2] ?? new Date().toISOString().replace(/[:.]/g, '-')
const WORD_LIMIT = 65

/** Rules every reply is held to, whatever the case. */
function replyRules(reply: string): string[] {
  const out: string[] = []
  if (/\binstall\b/i.test(reply)) out.push('says install')
  if (/—/.test(reply)) out.push('em dash')
  if (SPLIT_ABBREVIATION.test(reply)) out.push('split abbreviation')
  if (reply.split(/\s+/).filter(Boolean).length > WORD_LIMIT) out.push(`over ${WORD_LIMIT} words`)
  if (/couldn't answer that|down for a moment|didn't catch that/i.test(reply)) out.push('canned fallback')
  if (/\bopen (the )?(feed|analyze|plan|home|profile)\b|\b(feed|analyze) tab\b/i.test(reply)) out.push('sends to an app tab')
  return out
}

interface Reading { kind: string; reply?: string; value?: string; plan?: boolean; ms?: number }

async function ask(c: Case): Promise<Reading> {
  const tool = c.tool ?? 'rent'
  const res = await fetch(new URL('/internal/rentpilot/ask', BASE), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Rentpilot-Key': KEY },
    body: JSON.stringify({
      tool,
      result: c.figures === 'rent' ? RENT_RESULT : undefined,
      offer: c.figures === 'offer' ? OFFER_RESULT : undefined,
      message: c.message,
      step: c.step ?? '',
      history: c.history ?? [],
    }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) return { kind: `http ${res.status}` }
  return (await res.json()) as Reading
}

function judge(c: Case, r: Reading): string[] {
  const problems: string[] = []
  const kinds = ([] as Kind[]).concat(c.expect.kind)
  if (!kinds.includes(r.kind as Kind)) problems.push(`kind ${r.kind}, wanted ${kinds.join(' or ')}`)
  if (c.expect.value && r.value?.toUpperCase() !== c.expect.value.toUpperCase()) problems.push(`value ${r.value ?? '(none)'}, wanted ${c.expect.value}`)
  if (r.kind === 'question') {
    const reply = r.reply ?? ''
    if (c.expect.plan !== undefined && Boolean(r.plan) !== c.expect.plan) problems.push(`plan ${Boolean(r.plan)}, wanted ${c.expect.plan}`)
    for (const p of c.expect.says ?? []) if (!p.test(reply)) problems.push(`missing ${p}`)
    for (const p of c.expect.never ?? []) if (p.test(reply)) problems.push(`has ${p}`)
    problems.push(...replyRules(reply))
  }
  return problems
}

async function main() {
  if (!BASE || !KEY) throw new Error('RENTPILOT_URL and RENTPILOT_KEY are required (env or .env.local)')
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null
  const cases = only ? CASES.filter((c) => only.test(c.id)) : CASES
  const results: { id: string; area: string; message: string; pass: boolean; runs: { reading: Reading; problems: string[] }[] }[] = []
  // A few at a time: the reader is one service, and the cases are independent.
  const queue = [...cases]
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const runs = []
      for (let i = 0; i < RUNS; i++) {
        const began = Date.now()
        const reading = await ask(c).catch((e) => ({ kind: `error ${(e as Error).message}` }) as Reading)
        reading.ms = Date.now() - began
        runs.push({ reading, problems: judge(c, reading) })
      }
      results.push({ id: c.id, area: c.area, message: c.message, pass: runs.every((r) => r.problems.length === 0), runs })
    }
  }))
  results.sort((a, b) => cases.findIndex((c) => c.id === a.id) - cases.findIndex((c) => c.id === b.id))

  const byArea = new Map<string, { pass: number; total: number }>()
  for (const r of results) {
    const a = byArea.get(r.area) ?? { pass: 0, total: 0 }
    a.total++
    if (r.pass) a.pass++
    byArea.set(r.area, a)
  }
  const passed = results.filter((r) => r.pass).length
  console.log(`\n${LABEL}: ${passed}/${results.length} cases pass (${RUNS} runs each; a case passes only if every run does)\n`)
  for (const [area, a] of byArea) console.log(`  ${area.padEnd(12)} ${a.pass}/${a.total}`)
  const times = results.flatMap((r) => r.runs.map((x) => x.reading.ms ?? 0)).sort((a, b) => a - b)
  const pct = (p: number) => (times[Math.min(times.length - 1, Math.floor(times.length * p))] / 1000).toFixed(1)
  console.log(`\n  response time: median ${pct(0.5)}s, 90th percentile ${pct(0.9)}s, slowest ${pct(1)}s`)
  console.log('')
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`FAIL ${r.id}: "${r.message}"`)
    r.runs.forEach((run, i) => {
      const said = run.reading.reply ?? run.reading.value ?? ''
      console.log(`  run ${i + 1}: [${run.reading.kind}${run.reading.plan ? ', plan' : ''}] ${said.slice(0, 220)}`)
      if (run.problems.length) console.log(`         ${run.problems.join('; ')}`)
    })
  }
  const dir = join(process.cwd(), 'scripts/ribbit-eval/runs')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${LABEL}.json`), JSON.stringify({ label: LABEL, base: new URL(BASE).host, runs: RUNS, passed, total: results.length, results }, null, 2))
  console.log(`\nwrote scripts/ribbit-eval/runs/${LABEL}.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
