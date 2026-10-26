'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { TextOptIn } from '@/components/TextOptIn'
import { track } from '@/lib/analytics'
import { reply as engineReply, start, type ChatEvent, type ChatMessage, type ChatState, type Chip, type Flow, type Step } from '@/lib/ribbit/engine'
import { ribbitAppLink } from '@/lib/ribbit/appLink'
import { offerPlanData, rentPlanData } from '@/lib/ribbit/payload'
import { browserServices } from '@/lib/ribbit/services'

/**
 * The Ribbit chat on /ribbit_chat (spec: "Ribbit Chat Tool — Rent and Offer Flows"). The thread is the page: one
 * column, Ribbit on the left in brand green, the person on the right in linen, the options for the current turn
 * above a text field that is always there. The engine (lib/ribbit/engine.ts) decides every turn; this renders it,
 * keeps the thread in localStorage, and sends the events with the thread id and flow on each.
 */

const STORE_KEY = 'ribbit_chat_thread_v1'
const TOOL_PAGE: Record<Flow, string> = { rent: '/how-much-rent-can-i-afford', offer: '/what-is-my-job-offer-worth' }

interface Saved {
  id: string
  messages: ChatMessage[]
  state: ChatState
  chips: Chip[]
  input: Step['input']
  /** The open question while it is parked after a side answer (Step.parked): its options are folded. */
  parked?: string
  /** Caption over the options when they are not the answer to the last question (Step.chipsLabel). */
  chipsLabel?: string
}

const FINISH_LABEL: Record<Flow, string> = { rent: 'Finish my rent numbers', offer: 'Finish my offer numbers' }

/** "When does the job start?" → "when does the job start?", for after "Back to your plan:". Keeps "NYC". */
const inSentence = (q: string) => (/^[A-Z][a-z]/.test(q) ? q[0].toLowerCase() + q.slice(1) : q)

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `t${Date.now().toString(36)}`
}

function load(flow: Flow | null): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    // A thread opened for the other tool does not follow the person to this one.
    if (flow && saved.state.flow && saved.state.flow !== flow && !saved.state.facts.switchedFrom) return null
    return saved.messages?.length ? saved : null
  } catch {
    return null
  }
}

export function RibbitChat({ initialFlow, entry }: { initialFlow: Flow | null; entry: 'flow_param' | 'utm' | 'picker' }) {
  // The first message is computed synchronously, so it is in the page's HTML at load: no spinner before it.
  const first = useRef(start(initialFlow))
  const [thread, setThread] = useState<Saved>(() => ({
    id: '', messages: first.current.messages, state: first.current.state, chips: first.current.chips, input: first.current.input,
  }))
  const [restored, setRestored] = useState(false)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const lastAt = useRef<number>(Date.now())
  const endRef = useRef<HTMLDivElement>(null)

  const send = useCallback((events: ChatEvent[], id: string, flow: Flow | null) => {
    for (const e of events) track(e.name, { ...e.props, thread_id: id, flow: flow ?? 'picker' })
  }, [])

  // Restore a thread in progress, or start a new one with an id.
  useEffect(() => {
    const saved = load(initialFlow)
    if (saved) {
      setThread(saved)
      setRestored(true)
      return
    }
    const id = newId()
    setThread((t) => ({ ...t, id }))
    track('ribbit_thread_started', { thread_id: id, flow: initialFlow ?? 'picker', entry })
  }, [initialFlow, entry])

  useEffect(() => {
    if (!thread.id) return
    try { localStorage.setItem(STORE_KEY, JSON.stringify(thread)) } catch { /* private mode: the thread just won't survive a refresh */ }
  }, [thread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread.messages.length, busy])

  const answer = useCallback(async (r: { chip?: string; label?: string; text?: string }) => {
    if (busy) return
    const shown = r.label ?? r.text ?? ''
    if (!shown.trim()) return
    const seconds = Math.round((Date.now() - lastAt.current) / 1000)
    lastAt.current = Date.now()
    setText('')
    // A tapped "Show me the math" is not an answer, so it isn't echoed as one.
    const echo: ChatMessage[] = r.chip === '__math__' ? [] : [{ from: 'you', text: shown }]
    setThread((t) => ({ ...t, messages: [...t.messages, ...echo], chips: [], parked: undefined, chipsLabel: undefined }))
    setBusy(true)
    const began = Date.now()
    const step = await engineReply(thread.state, r.chip ? { chip: r.chip } : { text: r.text }, browserServices)
    // A short typing state, so the reply reads as answered rather than loaded (under a second).
    const wait = Math.max(0, 450 - (Date.now() - began))
    await new Promise((res) => setTimeout(res, wait))
    setBusy(false)
    setThread((t) => ({ ...t, messages: [...t.messages, ...step.messages], state: step.state, chips: step.chips, input: step.input, parked: step.parked, chipsLabel: step.chipsLabel }))
    send(step.events.map((e) => (e.name === 'ribbit_turn' ? { ...e, props: { ...e.props, seconds_since_last: seconds } } : e)), thread.id, step.state.flow)
  }, [busy, thread.state, thread.id, send])

  // Unfolds the parked question's options; the question itself is already in the thread above.
  const backToPlan = () => {
    setThread((t) => ({ ...t, parked: undefined }))
    track('ribbit_back_to_plan', { thread_id: thread.id, flow: thread.state.flow ?? 'picker', turn: thread.state.turn })
  }

  const startOver = () => {
    try { localStorage.removeItem(STORE_KEY) } catch { /* nothing stored */ }
    const s = start(initialFlow)
    const id = newId()
    setThread({ id, messages: s.messages, state: s.state, chips: s.chips, input: s.input })
    setRestored(false)
    track('ribbit_thread_started', { thread_id: id, flow: initialFlow ?? 'picker', entry, restart: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col">
      {/* Always there: a thread can need a restart before any reload (it used to show only on a restored one). */}
      <div className="mb-3 text-right">
        <button
          type="button"
          onClick={startOver}
          disabled={busy}
          className="text-[13px] font-semibold text-brand-700 underline underline-offset-2 disabled:opacity-50"
        >
          Start over
        </button>
      </div>

      <div className="flex flex-col gap-2.5" aria-live="polite">
        {thread.messages.map((m, i) => (
          <Bubble
            key={i}
            m={m}
            facts={thread.state.facts}
            threadId={thread.id}
            flow={thread.state.flow}
            // "Finish my numbers" belongs to the open question it would return to, so only while it is parked.
            onFinish={m.appAsk && thread.parked !== undefined && thread.state.flow ? backToPlan : undefined}
            onTextInstead={m.appAsk?.textInstead ? () => answer({ chip: 'text', label: 'Text me each step instead' }) : undefined}
          />
        ))}
        {thread.messages.length === first.current.messages.length && initialFlow && !restored && (
          <a
            href={TOOL_PAGE[initialFlow]}
            onClick={() => track('ribbit_skipped', { thread_id: thread.id, flow: initialFlow, turn: thread.state.turn })}
            className="self-start pl-1 text-[13px] font-semibold text-subtle underline underline-offset-2"
          >
            Just give me the number
          </a>
        )}
        {busy && (
          <div className="self-start rounded-2xl rounded-bl-md bg-[#386641] px-4 py-3 text-white" aria-label="Ribbit is typing">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:240ms]" />
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {thread.input !== 'none' && (
        <div className="sticky bottom-0 mt-4 border-t border-hairline bg-canvas pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {thread.parked !== undefined ? (
            <button
              type="button"
              onClick={backToPlan}
              className="mb-2.5 inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border-2 border-dashed border-[#386641] bg-white px-3.5 py-1.5 text-left text-[14px] font-semibold leading-snug text-[#386641] transition hover:bg-[#386641]/5"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14l-4-4 4-4" /><path d="M5 10h11a4 4 0 0 1 0 8h-1" /></svg>
              <span>{thread.parked ? `Back to your plan: ${inSentence(thread.parked)}` : 'Back to your plan'}</span>
            </button>
          ) : thread.chips.length > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              {thread.chipsLabel && <span className="w-full text-[13px] font-semibold text-subtle">{thread.chipsLabel}</span>}
              {thread.chips.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  disabled={busy}
                  onClick={() => answer({ chip: c.value, label: c.label })}
                  className="min-h-10 rounded-full border-2 border-[#386641] bg-white px-3.5 text-[14px] font-semibold text-[#386641] transition hover:bg-[#386641] hover:text-white disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); answer({ text }) }}
            className="flex items-center gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              inputMode={thread.input === 'money' ? 'decimal' : 'text'}
              placeholder={thread.parked !== undefined ? 'Ask anything else' : thread.input === 'money' ? 'Type a number, or ask anything' : thread.input === 'location' ? 'Type a city or state, or ask anything' : 'Type an answer, or ask anything'}
              aria-label="Your reply"
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 text-[16px] outline-none focus-visible:border-[#386641] focus-visible:ring-2 focus-visible:ring-[#386641]/20"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="h-12 shrink-0 rounded-xl bg-[#386641] px-5 text-[15px] font-bold text-white transition hover:bg-[#2d5a26] disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Bubble({ m, facts, threadId, flow, onFinish, onTextInstead }: {
  m: ChatMessage; facts: ChatState['facts']; threadId: string; flow: Flow | null; onFinish?: () => void; onTextInstead?: () => void
}) {
  if (m.from === 'you') {
    return (
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#EFE9DD] px-4 py-2.5 text-[15px] leading-snug text-ink">
        {m.text}
      </div>
    )
  }
  return (
    <div className="max-w-[92%] self-start">
      <div className="rounded-2xl rounded-bl-md bg-[#386641] px-4 py-3 text-[15px] leading-snug text-white">
        {m.figure && (
          <div className="mb-2">
            {m.figureLabel && <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/75">{m.figureLabel}</div>}
            <div className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] tabular-nums">{m.figure}</div>
            {m.compare && (
              <div className="mt-1 flex items-baseline gap-2 text-[13.5px] text-white/85">
                <span>{m.compare.label}</span>
                <span className="font-bold tabular-nums text-white">{m.compare.value}</span>
              </div>
            )}
          </div>
        )}
        <p>{m.text}</p>
        {m.math && (
          <dl className="mt-2.5 rounded-xl bg-white/10 px-3 py-2">
            {m.math.map((row, i) => (
              <div key={i} className={`flex justify-between gap-3 py-1 text-[13.5px] ${row.strong ? 'font-bold' : 'text-white/85'}`}>
                <dt>{row.label}</dt>
                <dd className="shrink-0 tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {m.handoff && <Handoff flow={m.handoff} facts={facts} threadId={threadId} />}
      {m.planCard && <PlanCard card={m.planCard} />}
      {m.appAsk && (
        <div className="mt-2.5 flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={ribbitAppLink(facts, flow, m.appAsk.why, threadId)}
              onClick={() => track('ribbit_app_link_clicked', { thread_id: threadId, flow: flow ?? 'picker', turn: m.turn, why: m.appAsk!.why })}
              // The brand lime, not the bubbles' green: on a green thread it has to read as the thing to tap.
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime px-5 py-2 text-left text-[15px] font-extrabold text-ink shadow-sm ring-1 ring-black/5 transition hover:brightness-95"
            >
              {m.appAsk.label}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </a>
            {onFinish && flow && (
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex h-12 items-center rounded-xl border-2 border-[#386641] bg-white px-4 text-[15px] font-semibold text-[#386641] transition hover:bg-[#386641]/5"
              >
                {FINISH_LABEL[flow]}
              </button>
            )}
          </div>
          {onTextInstead && (
            <button type="button" onClick={onTextInstead} className="py-1 text-[14px] font-semibold text-[#386641] underline underline-offset-[3px]">
              Not ready to connect? Text me each step instead
            </button>
          )}
          {m.appAsk.note && <p className="text-[13px] leading-snug text-subtle">{m.appAsk.note}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * The plan as WeLeap would show it: what the chat knows, then the rows only the bank can fill, shown locked.
 */
function PlanCard({ card }: { card: NonNullable<ChatMessage['planCard']> }) {
  return (
    <section aria-label="Your WeLeap plan preview" className="mt-2.5 rounded-2xl border border-hairline bg-white px-4 pb-1.5 pt-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[16px] font-extrabold text-ink">Your WeLeap plan</span>
        <span className="rounded-full bg-[#e5f4e4] px-2.5 py-1 text-[12px] font-semibold text-brand-700">From this chat</span>
      </div>
      {card.known.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 border-t border-[#f0efec] py-2.5 text-[14px]">
          <span className="text-ink-soft">{row.label}</span>
          <span className="text-right font-bold tabular-nums text-ink">{row.value}</span>
        </div>
      ))}
      <div className={`${card.known.length ? 'mt-2 border-t border-dashed border-[#c9cfc7]' : ''} pb-1 pt-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-subtle`}>
        Unlocks when you connect your bank
      </div>
      {card.locked.map((label) => (
        <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-[14px] text-subtle">
          <span className="inline-flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            {label}
          </span>
          <span aria-label="Shown after you connect" className="h-3 w-12 shrink-0 rounded-md bg-hairline" />
        </div>
      ))}
    </section>
  )
}

/**
 * The follow-up turn: the existing text door, with its counsel-approved consent and button, fed the same figures
 * the tool pages send (lib/ribbit/payload.ts). The figures are taken once, when the turn appears.
 */
function Handoff({ flow, facts, threadId }: { flow: Flow; facts: ChatState['facts']; threadId: string }) {
  const [plan] = useState(() => (flow === 'offer' ? offerPlanData(facts) : rentPlanData(facts)))
  if (!plan) return null
  return (
    <div className="mt-2.5 rounded-2xl border border-hairline bg-white p-4">
      <TextOptIn
        planData={plan}
        endpoint={flow === 'offer' ? '/api/offer-text' : '/api/rent-text'}
        tool={flow}
        onSubmitted={(method) => track('ribbit_handoff_accepted', { thread_id: threadId, flow, method })}
      />
    </div>
  )
}
