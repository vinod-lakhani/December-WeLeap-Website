/**
 * Plays one conversation through the real chat engine (lib/ribbit/engine.ts) with the site's own services
 * (lib/ribbit/services.ts), whose fetches go to the real route handlers (/api/ribbit-ask, /api/tax, /api/zori) in
 * this process: the same code path as the page, without a browser. The person is a persona: their numbers answer
 * whatever the chat asks, in their own style (tapping or typing), and a script adds what they type on top.
 */
import { reply, start, type Step } from '../../lib/ribbit/engine'
import { browserServices } from '../../lib/ribbit/services'
import { POST as askRoute } from '../../app/api/ribbit-ask/route'
import { POST as taxRoute } from '../../app/api/tax/route'
import { GET as zoriRoute } from '../../app/api/zori/route'
import { checkTurn, type Failure } from './checks'
import type { Conversation, Persona } from './conversations'

/** The visitor key for the ask route's per-visitor limit: one per conversation, as one person each. */
let visitor = 'convo'
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.startsWith('/api/')) {
    const req = new Request(`http://localhost${url}`, { ...init, headers: { ...(init?.headers as Record<string, string>), 'x-forwarded-for': visitor } })
    if (url.startsWith('/api/ribbit-ask')) return askRoute(req)
    if (url.startsWith('/api/tax')) return taxRoute(req as unknown as Parameters<typeof taxRoute>[0])
    if (url.startsWith('/api/zori')) return zoriRoute(req as unknown as Parameters<typeof zoriRoute>[0])
    throw new Error(`no route for ${url}`)
  }
  return realFetch(input, init)
}) as typeof fetch

export interface Line { from: 'person' | 'ribbit'; text: string; turn: string; chips?: string[] }
export interface Played { id: string; lines: Line[]; failures: Failure[]; finished: boolean; steps: number; asks: Array<{ flow: string; message: string; kind: string; reply: string }> }

type Answer = { chip?: string; text?: string }

const MAX_STEPS = 24
const ENDS = new Set(['M6', 'R8', 'O8'])

const chipValues = (s: Step) => s.chips.map((c) => c.value)
function pickChip(s: Step, ...wanted: RegExp[]): string | undefined {
  for (const w of wanted) {
    const c = s.chips.find((x) => w.test(x.value) || w.test(x.label))
    if (c) return c.value
  }
  return undefined
}

/** What this persona says to the chat's open question, read from the turn it is on. */
function personaAnswer(p: Persona, s: Step): Answer | null {
  const t = s.state.turn
  const tap = p.style !== 'types'
  if (/^(R1|M1|O1)$/.test(t)) {
    if (tap && p.takeHome === undefined && chipValues(s).includes('salary')) return { chip: 'salary' }
    return { text: p.takeHome !== undefined ? `${p.takeHome} a month take-home` : String(p.salary) }
  }
  if (/^(R1_amount|M1_amount)$/.test(t)) return { text: String(p.takeHome ?? p.salary) }
  if (/^(R2|O2|M2)$/.test(t)) {
    const c = tap ? pickChip(s, new RegExp(p.city, 'i')) : undefined
    return c ? { chip: c } : { text: p.city }
  }
  if (/_state$/.test(t)) return { text: p.state }
  if (/_metro$/.test(t)) return { chip: pickChip(s, new RegExp(p.city, 'i')) ?? s.chips[0]?.value, text: undefined }
  if (t === 'M3') return { text: String(p.rent) }
  if (t === 'R3_roommate') return { chip: pickChip(s, p.roommate ? /yes|roommate/i : /no|solo|alone|just me/i) ?? s.chips[0]?.value }
  if (t === 'R3_debt' || t === 'M4' || t === 'M4_more') {
    if (!p.debt) return tap ? { chip: pickChip(s, /^none$|no debt|^no$/i) ?? 'none' } : { text: 'no debt' }
    return { text: `${p.debt.balance} on a ${p.debt.kind} at ${p.debt.aprPct}%, paying ${p.debt.payment} a month` }
  }
  if (t === 'R3_debt_amount') return { text: String(p.debt?.payment ?? 0) }
  if (/^(M5|O4)$/.test(t)) {
    if (p.match === 'none') return { chip: pickChip(s, /^none$|no match/i) ?? 'none' }
    if (p.match === 'unknown') return { chip: pickChip(s, /unknown|not sure/i) ?? 'unknown' }
    return { text: p.match }
  }
  if (/_(formula|rate)$/.test(t)) return { chip: pickChip(s, /^yes/i) ?? s.chips[0]?.value }
  if (/^O3/.test(t)) return { chip: pickChip(s, /^none$|that's all|nothing/i) ?? s.chips[0]?.value }
  // Anything else with options (rent pick, start date, roommate share, card): the first real option.
  const c = s.chips.find((x) => !/^(not_now|__math__)$/.test(x.value))
  if (c) return { chip: c.value }
  return null
}

export async function play(convo: Conversation, run = 1): Promise<Played> {
  visitor = `${convo.id}-${run}-${Date.now()}`
  // Every reader call, with what came back, so a dropped or odd answer can be traced to the reading.
  const asks: Played['asks'] = []
  const svc = {
    ...browserServices,
    ask: async (input: Parameters<typeof browserServices.ask>[0]) => {
      const res = await browserServices.ask({ ...input, thread: visitor })
      asks.push({ flow: input.flow ?? '', message: input.message, kind: res?.kind ?? 'null', reply: (res?.reply ?? '').slice(0, 200) })
      return res
    },
  }
  const lines: Line[] = []
  const failures: Failure[] = []
  let step = start(convo.flow ?? null)
  const record = (st: Step) => {
    for (const m of st.messages) if (m.from === 'ribbit') lines.push({ from: 'ribbit', text: m.text, turn: st.state.turn })
    if (lines.length && st.chips.length) lines[lines.length - 1].chips = st.chips.map((c) => c.label)
  }
  record(step)
  const script = [...convo.says]
  let n = 0
  while (n < MAX_STEPS && !ENDS.has(step.state.turn)) {
    // The script's next line goes in when it is due (by turn, or right away), before the persona's own answer.
    // A picker conversation with its script used up and no tool picked is over: the person asked what they came to ask.
    if (!convo.flow && script.length === 0 && step.state.turn === 'P0') break
    const due = script[0] && (!script[0].at || script[0].at === step.state.turn) ? script.shift()! : null
    let answer: Answer | null = due ? { text: due.text, chip: due.chip } : personaAnswer(convo.persona, step)
    if (!answer) {
      failures.push({ rule: 'stuck', turn: step.state.turn, detail: 'the persona had no answer for this turn' })
      break
    }
    if (answer.chip && !chipValues(step).includes(answer.chip)) {
      failures.push({ rule: 'chip-missing', turn: step.state.turn, detail: `wanted to tap "${answer.chip}", offered: ${chipValues(step).join(', ') || 'none'}` })
      if (due) break
      answer = { text: answer.chip }
    }
    lines.push({ from: 'person', text: answer.text ?? `[${answer.chip}]`, turn: step.state.turn })
    const prev = step
    step = await reply(step.state, answer, svc)
    record(step)
    failures.push(...checkTurn(prev, answer, step, due?.expect))
    n++
  }
  const finished = ENDS.has(step.state.turn) || (convo.flow === undefined && !convo.mustFinish && script.length === 0)
  if (convo.mustFinish && !ENDS.has(step.state.turn)) failures.push({ rule: 'unfinished', turn: step.state.turn, detail: `stopped at ${step.state.turn} after ${n} replies` })
  if (script.length) failures.push({ rule: 'script-unused', turn: step.state.turn, detail: `never reached: ${script.map((x) => x.at ?? 'now').join(', ')}` })
  if (convo.end) failures.push(...checkTurn(step, {}, step, convo.end, 'end'))
  return { id: convo.id, lines, failures, finished, steps: n, asks }
}
