'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ACCEPT, readDocument, type DocKind } from '@/components/OfferLetterUpload'
import { TextOptIn } from '@/components/TextOptIn'
import { track } from '@/lib/analytics'
import { claimToolCompletion } from '@/lib/tool-funnel'
import { BENEFITS_CHIP, RENT_ARMS, UPLOAD_CHIP, assignRentArm, fc, reply as engineReply, start, type ChatEvent, type ChatMessage, type ChatState, type Chip, type Flow, type Place, type RentArm, type Reply, type Step } from '@/lib/ribbit/engine'
import { STORE_ASK, appDestination, askRoute, markPlanSaved, phoneAsk, planSaved, ribbitAppLink, ribbitOpenPlanLink, ribbitStoreLink, type AppDestination, type AskRoute } from '@/lib/ribbit/appLink'
import { offerPlanData, rentPlanData, startupPlanData } from '@/lib/ribbit/payload'
import { browserServices } from '@/lib/ribbit/services'
import { phonePlatform } from '@/lib/text-pilot'

/**
 * The Ribbit chat on /ribbit_chat (spec: "Ribbit Chat Tool — Rent and Offer Flows"). The thread is the page: one
 * column, Ribbit on the left in brand green, the person on the right in linen, the options for the current turn
 * above a text field that is always there. The engine (lib/ribbit/engine.ts) decides every turn; this renders it,
 * keeps the thread in localStorage, and sends the events with the thread id and flow on each.
 */

const STORE_KEY = 'ribbit_chat_thread_v1'
// The tool page each flow mirrors; "Where should my money go?" has none.
const TOOL_PAGE: Partial<Record<Flow, string>> = { rent: '/how-much-rent-can-i-afford', offer: '/what-is-my-job-offer-worth' }

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

const FINISH_LABEL: Record<Flow, string> = { rent: 'Finish my rent numbers', offer: 'Finish my offer numbers', money: 'Finish my plan', startup: 'Finish my offer numbers' }

/** "When does the job start?" → "when does the job start?", for after "Back to your plan:". Keeps "NYC". */
const inSentence = (q: string) => (/^[A-Z][a-z]/.test(q) ? q[0].toLowerCase() + q.slice(1) : q)

function device(): AppDestination {
  return appDestination(phonePlatform(navigator.userAgent, navigator.maxTouchPoints))
}

/** rent_arm on a rent thread's events (engine.ts RentArm); a picker thread gets it once it is in rent. */
function armProps(flow: Flow | null, arm: RentArm | undefined): { rent_arm?: RentArm } {
  return flow === 'rent' && arm ? { rent_arm: arm } : {}
}

/** ?rent_arm=control|b|c: a test sign-up on one arm (Nov 12, one per arm with a weleap.ai email before real
 *  traffic counts). Its events say rent_arm_forced, and the link into the app carries the arm as any other. */
function forcedArm(): RentArm | undefined {
  const v = new URLSearchParams(window.location.search).get('rent_arm')
  return RENT_ARMS.find((a) => a === v)
}

/**
 * The thread's rent arm, kept with it so a reload, a later visit or Start over never switches it. A thread stored
 * before the test that is already past the range saw the control chat, so it stays there.
 */
function threadArm(state: ChatState): RentArm {
  const forced = forcedArm()
  if (forced) return forced
  if (state.rentArm && RENT_ARMS.includes(state.rentArm)) return state.rentArm
  return state.flow === 'rent' && !state.turn.startsWith('R1') ? 'control' : assignRentArm()
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `t${Date.now().toString(36)}`
}

function load(flow: Flow | null): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    // An explicit flow (an ad's ?flow=, or its utm_content) opens that flow: a stored thread comes back only when it
    // is the same flow. A stored picker thread or another tool's thread would cost an ad click an extra turn.
    if (flow && saved.state.flow !== flow) return null
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
  // Read after mount (storage is client-only), so the server HTML and the first render agree.
  const [saved, setSaved] = useState(false)
  useEffect(() => setSaved(!!planSaved()), [])
  // The device's own destination: a phone's store, else the web app; askRoute (lib/ribbit/appLink.ts) decides per
  // flow. Read after mount: the server render has no user agent, so the first paint is the web link and a
  // phone swaps it before anyone can tap.
  const [destination, setDestination] = useState<AppDestination>('web')
  useEffect(() => setDestination(device()), [])
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const lastAt = useRef<number>(Date.now())
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // The document picker: the offer letter's chip or the benefits guide's (O4) opens it, and the read goes to the
  // engine as a reply (Reply.letter or Reply.benefits). `fileKind` is which one the open picker is for.
  const fileRef = useRef<HTMLInputElement>(null)
  const fileKind = useRef<DocKind>('offer')

  const send = useCallback((events: ChatEvent[], id: string, flow: Flow | null, arm: RentArm | undefined) => {
    const route = askRoute(flow, device())
    for (const e of events) {
      track(e.name, {
        ...e.props, thread_id: id, flow: flow ?? 'picker', ...armProps(flow, arm),
        ...(e.name === 'ribbit_app_ask_shown' ? { destination: route.to } : {}),
      })
      // The chat's first number is the tool page's completed calculation: the same tool_completed event, so the
      // same Google Ads conversion (lib/google-ads.ts), Meta and GA events, once per tool per tab as on the page
      // (claimToolCompletion). source tells the chat's apart in PostHog.
      if (e.name === 'ribbit_win_shown' && flow && claimToolCompletion(flow)) {
        track('tool_completed', { tool: flow, source: 'ribbit_chat', thread_id: id, turn: e.props.turn })
      }
    }
  }, [])

  // Restore a thread in progress, or start a new one with an id.
  useEffect(() => {
    const saved = load(initialFlow)
    if (saved) {
      setThread({ ...saved, state: { ...saved.state, rentArm: threadArm(saved.state) } })
      setRestored(true)
      return
    }
    const id = newId()
    // Every thread gets an arm, desktop and phone: a picker thread may go on to rent.
    const rentArm = forcedArm() ?? assignRentArm()
    setThread((t) => ({ ...t, id, state: { ...t.state, rentArm } }))
    track('ribbit_thread_started', { thread_id: id, flow: initialFlow ?? 'picker', entry, ...armProps(initialFlow, rentArm), ...(forcedArm() ? { rent_arm_forced: true } : {}) })
  }, [initialFlow, entry])

  useEffect(() => {
    if (!thread.id) return
    try { localStorage.setItem(STORE_KEY, JSON.stringify(thread)) } catch { /* private mode: the thread just won't survive a refresh */ }
  }, [thread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread.messages.length, busy])

  const answer = useCallback(async (r: { chip?: string; label?: string; text?: string; typed?: string; file?: File; kind?: DocKind }) => {
    if (busy) return
    if (r.chip === UPLOAD_CHIP.value || r.chip === BENEFITS_CHIP.value) {
      fileKind.current = r.chip === BENEFITS_CHIP.value ? 'benefits' : 'offer'
      track('doc_upload_started', { doc_class: fileKind.current === 'benefits' ? 'benefits_guide' : 'offer_letter', surface: 'chat', authed: false, thread_id: thread.id, flow: thread.state.flow ?? 'picker', turn: thread.state.turn })
      fileRef.current?.click()
      return
    }
    // Never the file's name: it often carries the person's own, and the thread is stored and sent with questions.
    const shown = r.file ? (r.kind === 'benefits' ? 'My benefits guide' : 'My offer letter') : r.label ?? r.text ?? ''
    if (!shown.trim()) return
    const seconds = Math.round((Date.now() - lastAt.current) / 1000)
    lastAt.current = Date.now()
    setText('')
    // A tapped "Show me the math" is not an answer, so it isn't echoed as one.
    const echo: ChatMessage[] = r.chip === '__math__' ? [] : [{ from: 'you', text: shown }]
    setThread((t) => ({ ...t, messages: [...t.messages, ...echo], chips: [], parked: undefined, chipsLabel: undefined }))
    setBusy(true)
    const began = Date.now()
    // The thread id goes with each typed question, for the backend's questions-per-thread cap.
    const services = { ...browserServices, ask: (i: Parameters<typeof browserServices.ask>[0]) => browserServices.ask({ ...i, thread: thread.id }) }
    let input: Reply
    if (r.file) {
      const kind = r.kind ?? 'offer'
      const read = await readDocument(r.file, kind, 'chat')
      const doc = read.ok ? { parsed: read.parsed } : { failed: read.reason }
      input = kind === 'benefits' ? { benefits: doc } : { letter: doc }
    } else input = r.chip ? { chip: r.chip, typed: r.typed } : { text: r.text }
    const step = await engineReply(thread.state, input, services)
    // A short typing state, so the reply reads as answered rather than loaded (under a second).
    const wait = Math.max(0, 450 - (Date.now() - began))
    await new Promise((res) => setTimeout(res, wait))
    setBusy(false)
    setThread((t) => ({ ...t, messages: [...t.messages, ...step.messages], state: step.state, chips: step.chips, input: step.input, parked: step.parked, chipsLabel: step.chipsLabel }))
    send(step.events.map((e) => (e.name === 'ribbit_turn' ? { ...e, props: { ...e.props, seconds_since_last: seconds } } : e)), thread.id, step.state.flow, step.state.rentArm)
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
    const rentArm = thread.state.rentArm
    setThread({ id, messages: s.messages, state: { ...s.state, rentArm }, chips: s.chips, input: s.input })
    setRestored(false)
    track('ribbit_thread_started', { thread_id: id, flow: initialFlow ?? 'picker', entry, restart: true, ...armProps(initialFlow, rentArm) })
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col">
      {/* Always there: a thread can need a restart before any reload (it used to show only on a restored one).
          "Open my plan" joins it once this browser has tapped a Save my plan link. */}
      <div className="mb-3 flex items-center justify-end gap-4">
        {saved && (
          <a
            href={ribbitOpenPlanLink()}
            onClick={() => track('ribbit_open_plan_clicked', { thread_id: thread.id, flow: thread.state.flow ?? 'picker', turn: thread.state.turn })}
            className="mr-auto inline-flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-1.5 text-[13px] font-extrabold text-ink shadow-sm ring-1 ring-black/5 transition hover:brightness-95"
          >
            Open my plan
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          </a>
        )}
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
            route={askRoute(thread.state.flow, destination)}
            rentArm={thread.state.rentArm}
            // "Finish my numbers" belongs to the open question it would return to, so only while it is parked.
            onFinish={m.appAsk && thread.parked !== undefined && thread.state.flow ? backToPlan : undefined}
            onTextInstead={m.appAsk?.textInstead ? () => answer({ chip: 'text', label: 'Text me each step instead' }) : undefined}
          />
        ))}
        {thread.messages.length === first.current.messages.length && initialFlow && TOOL_PAGE[initialFlow] && !restored && (
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

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) answer({ file, kind: fileKind.current })
        }}
      />

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
                  onClick={() => {
                    // Focused in the tap itself: a phone opens its keypad only for a focus made while handling a tap.
                    if (c.opensKeyboard) inputRef.current?.focus()
                    answer({ chip: c.value, label: c.label, typed: text })
                  }}
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
              ref={inputRef}
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

function Bubble({ m, facts, threadId, flow, route, rentArm, onFinish, onTextInstead }: {
  m: ChatMessage; facts: ChatState['facts']; threadId: string; flow: Flow | null; route: AskRoute; rentArm?: RentArm
  onFinish?: () => void; onTextInstead?: () => void
}) {
  if (m.from === 'you') {
    return (
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#EFE9DD] px-4 py-2.5 text-[15px] leading-snug text-ink">
        {m.text}
      </div>
    )
  }
  // On a phone the ask is the app, not the plan (it does not carry over an install yet): the note and the store's
  // icon say so. Only the web link saves the plan, so only it turns on "Open my plan".
  const { view, to: destination } = route
  const ask = m.appAsk && (view === 'web' ? m.appAsk : phoneAsk(m.appAsk, destination as Exclude<AppDestination, 'web'>))
  const text = (view !== 'web' && m.appAsk && STORE_ASK.texts[m.appAsk.why]) || m.text
  const askHref = ask && (destination === 'web' ? ribbitAppLink(facts, flow, ask.why, threadId, rentArm) : ribbitStoreLink(flow, destination))
  // surface: the button (or quiet link), or C's locked rows, which open the same sign-up.
  const onAskTap = (surface: 'button' | 'locked_card' = 'button') => {
    if (destination === 'web') markPlanSaved(flow)
    track('ribbit_app_link_clicked', {
      thread_id: threadId, flow: flow ?? 'picker', turn: m.turn, why: ask!.why, destination, surface,
      ...(ask!.gap ? { gap: ask!.gap } : {}), ...armProps(flow, rentArm),
    })
    if (surface === 'locked_card') track('ribbit_locked_card_tapped', { thread_id: threadId, flow: flow ?? 'picker', turn: m.turn, why: ask!.why, ...armProps(flow, rentArm) })
  }
  const storeMark = view === 'store' && destination !== 'web' ? destination : null
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
        <p>{text}</p>
        {m.fine && <p className="mt-1.5 text-[12.5px] italic leading-snug text-white/75">{m.fine}</p>}
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
      {m.order && <OrderCard steps={m.order} label="Your next-dollar order" />}
      {m.questions && <RecruiterQuestions questions={m.questions} threadId={threadId} />}
      {m.handoff && <Handoff flow={m.handoff} facts={facts} threadId={threadId} />}
      {m.planCard && <PlanCard card={m.planCard} lockedHref={m.planCard.lockedTitle && ask ? askHref : undefined} onLockedTap={() => onAskTap('locked_card')} />}
      {m.places && <PlacesCard places={m.places} />}
      {ask?.quiet && (
        // The benefit line's link: small, under the line, so it reads as information rather than a second pitch.
        <a
          href={askHref}
          onClick={() => onAskTap()}
          className="mt-1.5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#386641] underline underline-offset-[3px]"
        >
          {storeMark && <StoreGlyph store={storeMark} className="h-3.5 w-3.5" />}
          {ask.label}
          {!storeMark && <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>}
        </a>
      )}
      {ask && !ask.quiet && (
        <div className="mt-2.5 flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={askHref}
              onClick={() => onAskTap()}
              // The brand lime, not the bubbles' green: on a green thread it has to read as the thing to tap.
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime px-5 py-2 text-left text-[15px] font-extrabold text-ink shadow-sm ring-1 ring-black/5 transition hover:brightness-95"
            >
              {storeMark && <StoreGlyph store={storeMark} className="h-[18px] w-[18px] shrink-0" />}
              {ask.label}
              {!storeMark && <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>}
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
              {view === 'web' ? 'Not ready to connect? Text me each step instead' : STORE_ASK.textInstead}
            </button>
          )}
          {ask.note && <p className="text-[13px] leading-snug text-subtle">{ask.note}</p>}
        </div>
      )}
    </div>
  )
}

/** The store a phone's ask opens, on the button itself, so the label's promise never hides the download. The marks
 *  are the ones in the official badges (public/badges, StoreBadges); screen readers hear "App Store" or "Google Play". */
function StoreGlyph({ store, className }: { store: 'app_store' | 'google_play'; className: string }) {
  return store === 'app_store' ? (
    <svg role="img" aria-label="App Store:" viewBox="7.5 8.5 20 22" className={className} fill="currentColor">
      <path d="M24.76888,20.30068a4.94881,4.94881,0,0,1,2.35656-4.15206,5.06566,5.06566,0,0,0-3.99116-2.15768c-1.67924-.17626-3.30719,1.00483-4.1629,1.00483-.87227,0-2.18977-.98733-3.6085-.95814a5.31529,5.31529,0,0,0-4.47292,2.72787c-1.934,3.34842-.49141,8.26947,1.3612,10.97608.9269,1.32535,2.01018,2.8058,3.42763,2.7533,1.38706-.05753,1.9051-.88448,3.5794-.88448,1.65876,0,2.14479.88448,3.591.8511,1.48838-.02416,2.42613-1.33124,3.32051-2.66914a10.962,10.962,0,0,0,1.51842-3.09251A4.78205,4.78205,0,0,1,24.76888,20.30068Z" />
      <path d="M22.03725,12.21089a4.87248,4.87248,0,0,0,1.11452-3.49062,4.95746,4.95746,0,0,0-3.20758,1.65961,4.63634,4.63634,0,0,0-1.14371,3.36139A4.09905,4.09905,0,0,0,22.03725,12.21089Z" />
    </svg>
  ) : (
    <svg role="img" aria-label="Google Play:" viewBox="17 12 42 47" className={className}>
      <path fill="#ea4335" d="M36.6,34.41l-18.86,20.02s0,0,0,.01c.58,2.17,2.56,3.77,4.92,3.77.94,0,1.83-.26,2.58-.7l.06-.04,21.23-12.25-9.94-10.82Z" />
      <path fill="#fbbc04" d="M55.68,31h-.02s-9.17-5.33-9.17-5.33l-10.33,9.19,10.36,10.36,9.12-5.26c1.6-.86,2.68-2.55,2.68-4.49s-1.07-3.61-2.65-4.47h0Z" />
      <path fill="#4285f4" d="M17.73,16.44c-.11.42-.17.86-.17,1.31v35.38c0,.45.06.89.17,1.31l19.51-19.51-19.51-18.49Z" />
      <path fill="#34a853" d="M36.74,35.43l9.76-9.76-21.21-12.3c-.77-.46-1.67-.73-2.63-.73-2.36,0-4.34,1.6-4.92,3.78h0s19,19,19,19h0Z" />
    </svg>
  )
}

/**
 * The plan as WeLeap would show it: what the chat knows, then the rows only the bank can fill, shown locked.
 */
/** "Where should my money go?": the order as numbered steps, the paying ones first in solid green (mock-up 10). */
/** Numbered steps; the first `lead` are set dark (the order's first two come first; every recruiter question counts). */
function OrderCard({ steps, label, lead = 2 }: { steps: { key: string; title: string; detail: string }[]; label: string; lead?: number }) {
  return (
    <section aria-label={label} className="mt-2.5 rounded-2xl border border-hairline bg-white px-4 py-1.5 shadow-sm">
      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={s.key} className={`flex gap-3 py-3 ${i < steps.length - 1 ? 'border-b border-[#f0efec]' : ''}`}>
            <span aria-hidden="true" className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${i < lead ? 'bg-[#386641] text-white' : 'bg-[#e5f4e4] text-brand-700'}`}>{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold text-ink">{s.title}</span>
              <span className="text-[14px] leading-snug text-ink-soft">{s.detail}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** The startup ending's questions for the recruiter: the order's numbered card, and a copy button for an email. */
function RecruiterQuestions({ questions, threadId }: { questions: NonNullable<ChatMessage['questions']>; threadId: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const body = questions.map((q, i) => `${i + 1}. ${q.title}`).join('\n')
    try {
      await navigator.clipboard.writeText(body)
      setCopied(true)
      track('ribbit_recruiter_questions_copied', { thread_id: threadId, count: questions.length })
    } catch { /* clipboard refused: the questions are still on screen to select */ }
  }
  return (
    <>
      <OrderCard steps={questions} label="Questions for the recruiter" lead={questions.length} />
      <button type="button" onClick={copy} className="mt-2 text-[14px] font-semibold text-[#386641] underline underline-offset-[3px]">
        {copied ? 'Copied' : 'Copy the questions'}
      </button>
    </>
  )
}

/** lockedHref: the locked rows open the ask's sign-up too (C, where they are what the account unlocks). */
function PlanCard({ card, lockedHref, onLockedTap }: { card: NonNullable<ChatMessage['planCard']>; lockedHref?: string; onLockedTap?: () => void }) {
  const done = card.steps?.filter((s) => s.done).length ?? 0
  const lockedRows = card.locked.map((label) => (
    <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-[14px] text-subtle">
      <span className="inline-flex items-center gap-2">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        {label}
      </span>
      <span aria-label={card.lockedTitle ? 'Shown after you sign up' : 'Shown after you connect'} className="h-3 w-12 shrink-0 rounded-md bg-hairline" />
    </div>
  ))
  return (
    <section aria-label={card.title ?? 'Your WeLeap plan preview'} className="mt-2.5 rounded-2xl border border-hairline bg-white px-4 pb-1.5 pt-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[16px] font-extrabold text-ink">{card.title ?? 'Your WeLeap plan'}</span>
        {card.steps ? (
          <span className="shrink-0 rounded-full bg-[#e5f4e4] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-brand-700">{done} of {card.steps.length} done</span>
        ) : card.badge ? (
          <span className="shrink-0 rounded-full bg-[#e5f4e4] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-brand-700">{card.badge}</span>
        ) : card.known.length > 0 && (
          // Only when something on the card came from the chat: a question asked before Rent or Offer has no numbers yet.
          <span className="rounded-full bg-[#e5f4e4] px-2.5 py-1 text-[12px] font-semibold text-brand-700">From this chat</span>
        )}
      </div>
      {card.known.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 border-t border-[#f0efec] py-2.5 text-[14px]">
          <span className="text-ink-soft">{row.label}</span>
          <span className="text-right font-bold tabular-nums text-ink">{row.value}</span>
        </div>
      ))}
      {card.steps ? (
        // The move-in score's card: what's done, and the two steps the app does (the gap plan, the spending check).
        <ul className={`${card.known.length ? 'mt-2 border-t border-dashed border-[#c9cfc7]' : ''} pb-1 pt-1.5`}>
          {card.steps.map((s) => (
            <li key={s.label} className={`flex items-center gap-2.5 py-2 text-[14px] ${s.done ? 'text-ink' : 'font-semibold text-ink'}`}>
              {s.done ? (
                <span aria-label="Done" className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#386641] text-white">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
              ) : (
                <span aria-label="Not done yet" className="h-[18px] w-[18px] shrink-0 rounded-[5px] border-2 border-[#9aa597] bg-white" />
              )}
              {s.label}
            </li>
          ))}
        </ul>
      ) : card.locked.length > 0 && (
        <>
          <div className={`${card.known.length ? 'mt-2 border-t border-dashed border-[#c9cfc7]' : ''} pb-1 pt-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-subtle`}>
            {card.lockedTitle ?? 'Unlocks when you connect your bank'}
          </div>
          {lockedHref ? (
            <a href={lockedHref} onClick={onLockedTap} className="-mx-2 block rounded-xl px-2 transition hover:bg-[#f6f5f0]">{lockedRows}</a>
          ) : lockedRows}
        </>
      )}
    </section>
  )
}

/** Rent arm B's places side by side: a row per figure, a column per place, the best score in green. */
function PlacesCard({ places }: { places: Place[] }) {
  const best = Math.max(...places.map((p) => p.score))
  const cols = { gridTemplateColumns: `minmax(0, 1.2fr) repeat(${places.length}, minmax(0, 1fr))` }
  const rows: { label: string; value: (p: Place) => string }[] = [
    { label: 'Rent', value: (p) => fc(p.rent) },
    { label: 'Move-in cash', value: (p) => fc(p.moveIn) },
    { label: 'Left monthly', value: (p) => fc(p.left) },
    { label: 'Score', value: (p) => String(p.score) },
  ]
  return (
    <section aria-label="Your places side by side" className="mt-2.5 rounded-2xl border border-hairline bg-white px-4 pb-1.5 pt-3.5 shadow-sm">
      <div className="grid gap-2 pb-2 text-[13px] font-bold text-ink-soft" style={cols}>
        <span />
        {places.map((p, i) => <span key={i} className="truncate text-right">{p.short}</span>)}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2 border-t border-[#f0efec] py-2.5 text-[14px] tabular-nums" style={cols}>
          <span className="text-ink-soft">{row.label}</span>
          {places.map((p, i) => (
            <span key={i} className={`text-right font-bold ${row.label === 'Score' && p.score === best ? 'text-brand-700' : 'text-ink'}`}>{row.value(p)}</span>
          ))}
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
  // A startup offer texts as an offer thread, with its equity figures on the payload.
  const [plan] = useState(() => (flow === 'startup' ? startupPlanData(facts) : flow === 'offer' ? offerPlanData(facts) : rentPlanData(facts)))
  if (!plan) return null
  return (
    <div className="mt-2.5 rounded-2xl border border-hairline bg-white p-4">
      <TextOptIn
        planData={plan}
        endpoint={flow === 'rent' ? '/api/rent-text' : '/api/offer-text'}
        tool={flow === 'rent' ? 'rent' : 'offer'}
        onSubmitted={(method) => track('ribbit_handoff_accepted', { thread_id: threadId, flow, method })}
      />
    </div>
  )
}
