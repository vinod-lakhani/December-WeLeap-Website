/**
 * The rules every turn of every conversation is held to, and a script line's own expectations. Each rule is one a
 * real thread broke (Oct 28: a car loan thread that promised a calculation three times, asked for numbers "using
 * words only", and ended on the picker with no way to check the payment against their pay).
 */
import type { Step } from '../../lib/ribbit/engine'

export interface Failure { rule: string; turn: string; detail: string }
export interface Expect {
  /** Every pattern must match what Ribbit said this turn. */
  says?: RegExp[]
  /** No pattern may match it. */
  never?: RegExp[]
  /** These chip values must be offered after this turn. */
  chips?: string[]
}

const FALLBACK = /answers are down|couldn't answer that from your|lot of questions for one sitting/i
// The backend rejects these in a reading (backend/ai/guest.go offerToCalculate, askForWords); here for the whole
// turn, including the chat's own lines.
const PROMISE = /\bsay yes\b|\bcalculat\w* (it |that |this )?now\b|\b(run|do) (the|that|this) (math|calculation|numbers) now\b|\brunning (the|a) (loan )?calculat|\bif you want (the )?exact\b|\bi ran (the|a) (loan )?calc/i
const ASK_WORDS = /\b(using|in) words( only)?\b|\bno raw numbers\b/i
const ENDS = new Set(['M6', 'R8', 'O8'])

// What Ribbit said this turn, with the order's steps when it showed one.
const ribbitText = (s: Step) => s.messages.filter((m) => m.from === 'ribbit')
  .map((m) => [m.text, ...(m.order ?? []).map((o) => `${o.title}: ${o.detail}`)].join(' ')).join(' ')

export function checkTurn(prev: Step, _answer: { chip?: string; text?: string }, next: Step, expect?: Expect, label?: string): Failure[] {
  const out: Failure[] = []
  const turn = label ?? prev.state.turn
  const said = ribbitText(next)
  const fail = (rule: string, detail: string) => out.push({ rule, turn, detail })
  if (!label) {
    if (!said.trim()) fail('silent', 'Ribbit said nothing')
    if (FALLBACK.test(said)) fail('fallback', said.slice(0, 160))
    if (PROMISE.test(said)) fail('promise', said.match(PROMISE)![0])
    if (ASK_WORDS.test(said)) fail('asks-for-words', said.slice(0, 160))
    const last = next.messages.filter((m) => m.from === 'ribbit').at(-1)?.text.trim() ?? ''
    if (!ENDS.has(next.state.turn) && next.chips.length === 0 && !last.endsWith('?') && next.input === 'text') {
      fail('dead-end', `no options and no question after: "${last.slice(0, 120)}"`)
    }
    const before = ribbitText(prev)
    if (said && said === before) fail('repeat', said.slice(0, 120))
  }
  for (const re of expect?.says ?? []) if (!re.test(said)) fail('missing', `${re} not in: "${said.slice(0, 200)}"`)
  for (const re of expect?.never ?? []) if (re.test(said)) fail('unwanted', `${re} in: "${said.slice(0, 200)}"`)
  for (const c of expect?.chips ?? []) {
    if (!next.chips.some((x) => x.value === c)) fail('no-follow-up', `chip "${c}" not offered; chips: ${next.chips.map((x) => x.value).join(', ') || 'none'}`)
  }
  return out
}
