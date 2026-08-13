"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "./components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { cn } from "@/lib/utils"
import { PRESENT_DAY_TOOLS, TOOL_COUNT_WORD } from "@/lib/tools"
import { ToolCard } from "@/components/ToolCard"

/* ============================================================================
   Shared bits
   ========================================================================== */

const NUM = "tabular-nums tracking-[-0.02em]"

function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]",
        tone === "dark" ? "text-brand-700" : "text-lime",
      )}
    >
      {children}
    </div>
  )
}

function SectionHead({
  eyebrow,
  title,
  sub,
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3.5 text-balance text-[clamp(2rem,3.6vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
        {title}
      </h2>
      {sub ? <p className="mt-4 text-lg leading-relaxed text-subtle">{sub}</p> : null}
    </div>
  )
}

/* ============================================================================
   Hero — the Leap card cycles through three real moves
   ========================================================================== */

const HERO_LEAPS = [
  {
    title: "Capture your full 401(k) match",
    desc: "You’re deferring 3%. Your employer matches every dollar up to 6% — you’re leaving half of it on the table.",
    label: "Free money you’re missing",
    value: "+$750",
    unit: "/mo",
    aside1: "≈ $212k",
    aside2: "by age 60",
  },
  {
    title: "Move $4,200 out of checking",
    desc: "It’s earning 0.01% where it sits. The same money in a high-yield account pays about 4.3%.",
    label: "You’re leaving on the table",
    value: "+$183",
    unit: "/yr",
    aside1: "≈ $2,240",
    aside2: "over 10 yrs",
  },
  {
    title: "Clear the 22% APR card first",
    desc: "Investing ahead of this is a losing trade — no portfolio reliably beats 22% a year.",
    label: "Interest you’d avoid",
    value: "$1,240",
    unit: " saved",
    aside1: "debt-free",
    aside2: "14 mo sooner",
  },
]

function Hero() {
  const [i, setI] = useState(0)
  const [fading, setFading] = useState(false)
  const [paused, setPaused] = useState(false)

  const goTo = (next: number) => {
    if (next === i) return
    setFading(true)
    setTimeout(() => {
      setI(next)
      setFading(false)
    }, 200)
  }

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => goTo((i + 1) % HERO_LEAPS.length), 5200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused])

  const leap = HERO_LEAPS[i]

  return (
    <Section variant="canvas" isHero className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[8%] -top-32 h-[620px] w-[620px] rounded-full"
        style={{ background: "radial-gradient(circle at 35% 35%, rgba(167,201,87,.20), transparent 68%)" }}
      />
      <Container maxWidth="wide">
        <div className="relative grid items-center gap-x-16 gap-y-14 lg:grid-cols-[1.1fr_.9fr]">
          {/* copy */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-hairline bg-white py-1.5 pl-2 pr-4 shadow-sm">
              <img src="/images/ribbit.png" alt="" className="h-[26px] w-[26px] object-contain" />
              <span className="text-[13.5px] font-semibold text-ink-soft">Meet Ribbit — your financial sidekick</span>
            </div>

            <h1 className="max-w-[620px] text-balance text-[clamp(2.4rem,4.35vw,3.95rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink">
              You’re not behind.
              <br />
              You just don’t have
              <br />
              <span className="relative inline-block">
                <span className="text-brand-700">a next move.</span>
                <svg
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  aria-hidden
                  className="absolute -bottom-1.5 left-0 h-[11px] w-full"
                >
                  <path d="M2 8 C 70 2, 150 2, 298 6" fill="none" stroke="#a7c957" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-[530px] text-[19px] leading-relaxed text-subtle">
              WeLeap finds the money sitting idle in your accounts and shows you the{" "}
              <strong className="font-bold text-ink">single move that does the most</strong> — 401(k) match, HYSA, Roth,
              or debt. You approve it. That’s a Leap.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <EarlyAccessDialog signupType="hero" placement="hero">
                <Button className="rounded-full bg-brand-700 px-8 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800">
                  Get your first Leap →
                </Button>
              </EarlyAccessDialog>
              <Link
                href="#how-it-works"
                className="rounded-full border border-brand-100 px-7 py-[17px] text-[17px] font-bold text-brand-700 transition hover:bg-brand-700/5"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-faint">
              <span>Free to start</span>
              <span aria-hidden>·</span>
              <span>2 minutes</span>
              <span aria-hidden>·</span>
              <span>No card</span>
              <span aria-hidden>·</span>
              <span className="font-semibold text-brand-700">You approve every move</span>
            </div>
          </div>

          {/* product moment */}
          <div className="relative pb-10">
            <div className="absolute -top-5 right-1.5 z-20 flex items-center gap-2.5 rounded-full border border-hairline bg-white px-[18px] py-2.5 shadow-card">
              <span className="relative flex h-[9px] w-[9px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-[9px] w-[9px] rounded-full bg-brand-700" />
              </span>
              <span className="text-[13.5px] font-bold text-ink">Ribbit found 3 moves</span>
            </div>

            <div
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="relative z-10 rounded-[26px] border border-hairline bg-white p-[26px] pb-6"
              style={{ boxShadow: "0 2px 4px rgba(16,32,26,.05), 0 24px 60px rgba(16,32,26,.13)" }}
            >
              <div className="flex items-center justify-between">
                <Eyebrow>
                  <span className="inline-block h-[7px] w-[7px] rounded-full bg-lime" />
                  Next Leap
                </Eyebrow>
                <div className="flex items-center gap-1.5">
                  {HERO_LEAPS.map((_, d) => (
                    <button
                      key={d}
                      onClick={() => goTo(d)}
                      aria-label={`Show Leap ${d + 1}`}
                      className={cn(
                        "h-[7px] rounded-full transition-all duration-300",
                        d === i ? "w-5 bg-brand-700" : "w-[7px] bg-brand-100",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div
                className="transition-all duration-200"
                style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(6px)" : "none" }}
              >
                <div className="min-h-[132px]">
                  <h3 className="mb-2.5 mt-3.5 text-[25px] font-extrabold leading-tight tracking-[-0.022em] text-ink">
                    {leap.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-subtle">{leap.desc}</p>
                </div>

                <div className="mt-3 flex items-end justify-between rounded-2xl border border-brand-100 bg-brand-50 px-[18px] py-4">
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-700">
                      {leap.label}
                    </div>
                    <div className={cn("text-[30px] font-extrabold leading-none text-ink", NUM)}>
                      {leap.value}
                      <span className="text-[15px] font-semibold text-subtle">{leap.unit}</span>
                    </div>
                  </div>
                  <div className="text-right text-[12.5px] leading-snug text-subtle">
                    <strong className={cn("text-ink", NUM)}>{leap.aside1}</strong>
                    <br />
                    {leap.aside2}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <EarlyAccessDialog signupType="hero" placement="hero_leap_card">
                  <Button className="rounded-full bg-brand-700 px-6 py-3 text-[15px] font-bold text-white shadow-pill transition hover:bg-brand-800">
                    Approve this Leap
                  </Button>
                </EarlyAccessDialog>
                <span className="px-3 py-3 text-[14.5px] font-semibold text-subtle">Not now</span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3.5 text-[12.5px] text-faint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Nothing moves until you tap approve.
              </div>
            </div>

            {/* Sits behind the Leap card (z-5 vs z-10) on purpose — the tuck gives
                the hero depth. At -left-24 the card cut 24px into his silhouette,
                clipping his raised hand. The PNG carries ~32px of transparent
                padding on its right at this size, so -left-32 clears the artwork
                by ~8px while the image box still overlaps: he tucks, nothing cuts. */}
            <img
              src="/images/ribbit.png"
              alt="Ribbit, the WeLeap financial sidekick"
              className="absolute -bottom-8 -left-32 z-[5] hidden w-[152px] lg:block"
              style={{ filter: "drop-shadow(0 18px 26px rgba(16,32,26,.22))" }}
            />
          </div>
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Problem
   ========================================================================== */

// First-party data from our own survey. Keep the citation next to the numbers
// — unsourced stats on a finance site are a credibility liability, and a
// self-run survey invites more scrutiny than a third-party one, not less.
// TODO: add sample size and field dates to the source line once confirmed.
const STATS = [
  { n: "73%", t: "don’t have a clear, complete view of their finances in one place" },
  { n: "1 in 5", t: "feel very confident about basic financial concepts" },
  { n: "44%", t: "rarely or never use financial tools to manage their money" },
]

function Problem() {
  return (
    <Section variant="canvas">
      <Container maxWidth="wide">
        <SectionHead
          eyebrow="The real problem"
          title={
            <>
              Your money isn’t lazy.
              <br />
              It’s just unassigned.
            </>
          }
          sub="You’re earning. You’re saving a bit. But it sits in checking doing nothing while you scroll conflicting advice from people who don’t know your numbers."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.n} className="rounded-card border border-brand-100 bg-brand-50 p-7">
              <div className={cn("text-[44px] font-extrabold leading-none text-brand-700", NUM)}>{s.n}</div>
              <p className="mt-3 text-[16px] leading-snug text-ink-soft">{s.t}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[12.5px] leading-relaxed text-faint">
          Source: WeLeap Financial Needs Survey.
        </p>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Research quotes — from the moderated sessions
   ========================================================================== */

// Each carries the session timestamp it was pulled from so it can be checked
// against the scorecards in weleap-advisor/docs/user-research.
//   K.D. = C2 (screened ICP Builder) · H.C. = C1 (screened ICP Builder)
//   J.C. = P3 (near-ICP) · K.M. = N3 (new-UI arm)
//   N.B. = N4 (new-UI arm, screened Builder 3/3 — best ICP fit recruited)
//
// One card per person. N.B. had a second strong line ("…there are better ways
// to save", 00:31:20) that is deliberately unused: running both would repeat
// the same-person problem the K.D. pair created.
//
// These no longer claim to be "verbatim" on the page. The research kit holds
// scorecards and synthesis only — there are no raw transcripts in it — so the
// claim isn't backed by anything we can check. The scorecards are themselves
// derived from auto-generated transcripts that garbled "WeLeap" as "wheelie
// pool" and "Ribbit" as "rivet", so they carry drift of their own. Restore the
// word only after checking these four against the recordings.
//
// Only one K.D. quote runs. Two of the four cards used to be the same person,
// which read as a thinner sample than we actually have.
//
// All three were checked against the timestamped quote blocks in their own
// scorecards (not the synthesis workbook, which paraphrases). Where material
// is dropped mid-quote the ellipsis is kept, so the cut is visible.
//
// Rights: every participant signed the Home From College contractor
// agreement, which assigns their session content to us as a Deliverable and
// grants name/likeness use on a "perpetual, irrevocable" basis for advertising
// (§5). Full names are therefore permitted — initials are our own choice, not
// a legal limit, so this can be loosened later without re-papering anything.
//
// The sessions were paid, which is a material connection under the FTC
// endorsement guides. The disclosure under the grid is required and should not
// be removed. The amount is left unstated because the gig posting ($60) and
// the signed agreement ($25) disagree.
const VOICES = [
  {
    q: "A lot of times I know I should be doing more, but I don’t know exactly what.",
    who: "K.D.",
    ctx: "Post-grad, already investing",
    ref: "00:45:15",
  },
  {
    q: "Everyone I hear is just like “max out your account” — okay, but what does that even look like? … it was like a coach almost.",
    who: "H.C.",
    ctx: "Post-grad, working full-time",
    ref: "00:47:48",
  },
  {
    q: "It meets you where you are and explains where you could be if you put some steps in place…",
    who: "J.C.",
    ctx: "Final-year student, saves half her paycheck",
    ref: "00:54:07",
  },
  {
    q: "My thoughts were always I just put things in savings and then I didn’t know what to do with it after that…",
    who: "K.M.",
    ctx: "Job searching",
    ref: "00:59:14",
  },
  {
    // Starts at the framing clause, which is the part that has to survive. Cut
    // any later — at "this is how much money I'm making" — and it reads as her
    // own plea, when in context she is completing "it's an easy way to say…",
    // i.e. describing what the product does for her. Her scene-setting first
    // sentence is dropped; like K.D.'s, this begins at a sentence boundary, so
    // it takes no leading ellipsis.
    q: "It’s just an easy way to say: this is how much money I’m making, I don’t know what to do with it, just help me figure out what to do with it.",
    who: "N.B.",
    ctx: "Final-year student, working full-time",
    ref: "00:33:13",
  },
]

function Voices() {
  return (
    <Section variant="canvas" className="pt-0">
      <Container maxWidth="wide">
        <SectionHead
          eyebrow="From our research sessions"
          title="What people said when they saw it."
        />
        <div className="mt-12 flex flex-wrap justify-center gap-5">
          {VOICES.map((v) => (
            <figure
              key={v.q}
              className="flex basis-full flex-col rounded-card border border-hairline bg-white p-6 shadow-card sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-13.34px)]"
            >
              <div className="mb-1.5 text-[40px] font-extrabold leading-none text-brand-100">“</div>
              <blockquote className="flex-1 text-[16.5px] font-semibold leading-snug text-ink">{v.q}</blockquote>
              <figcaption className="mt-4 border-t border-hairline pt-3.5">
                <div className="text-[14px] font-bold text-brand-700">{v.who}</div>
                <div className="text-[13px] text-faint">{v.ctx}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-8 text-center text-[12.5px] leading-relaxed text-faint">
          Quoted from moderated user research sessions. Participants were compensated for their time.
        </p>
      </Container>
    </Section>
  )
}

/* ============================================================================
   How it works — real product UI, alternating rows
   ========================================================================== */

const STEPS = [
  {
    n: "01",
    t: "Connect your accounts",
    d: "Two minutes, read-only, bank-level security through Plaid. We never touch your money.",
    shot: "/images/product/setup-checklist.png",
    w: 1720,
    h: 680,
    alt: "WeLeap setup checklist: plan created, connect a bank, add your 401(k) and HSA",
  },
  {
    n: "02",
    t: "Ribbit finds your Leap",
    d: "He reads your whole picture — cash, debt, 401(k), goals — and ranks every option to find the one that does the most.",
    shot: "/images/product/weekly-focus.jpg",
    w: 1400,
    h: 529,
    alt: "This week’s focus in WeLeap: capture your full 401(k) match, worth $750 a month",
  },
  {
    n: "03",
    t: "You approve it",
    d: "See the move, the dollar impact, and exactly what changes — before and after. Tap confirm, or edit it. Nothing happens without you.",
    shot: "/images/product/confirm-goal.png",
    w: 1400,
    h: 1240,
    alt: "Ribbit proposes a new savings goal with a before-and-after contribution table and a confirm button",
  },
]

function How() {
  return (
    <Section variant="white" id="how-it-works" className="border-y border-hairline scroll-mt-24">
      <Container maxWidth="wide">
        <SectionHead eyebrow="How it works" title="Three steps. Then one decision a week." />

        {/* Alternating rows, not a 3-up grid: real product UI is illegible at
            card width, and these shots are the strongest proof on the page. */}
        <div className="mt-16 flex flex-col gap-16 md:gap-20">
          {STEPS.map((s, i) => (
            <div key={s.n} className="grid items-center gap-8 md:gap-14 lg:grid-cols-2">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-[34px] w-[34px] items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-[13px] font-extrabold text-brand-700",
                      NUM,
                    )}
                  >
                    {s.n}
                  </span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>
                <h3 className="mb-3 text-[clamp(1.4rem,2.2vw,1.9rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
                  {s.t}
                </h3>
                <p className="max-w-[460px] text-[17px] leading-relaxed text-subtle">{s.d}</p>
              </div>

              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <img
                  src={s.shot}
                  alt={s.alt}
                  width={s.w}
                  height={s.h}
                  loading="lazy"
                  className="block h-auto w-full rounded-[20px] border border-hairline bg-canvas shadow-card"
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Leap examples
   ========================================================================== */

const LEAPS = [
  { tag: "Free money", tone: "text-cat-savings bg-cat-savings/10", t: "Capture your 401(k) match", d: "You’re at 3%, they match to 6%.", impact: "+$9,000", unit: "/year" },
  { tag: "Idle cash", tone: "text-cat-wants bg-cat-wants/10", t: "Move $4,200 to a HYSA", d: "It’s earning 0.01% in checking today.", impact: "+$183", unit: "/year" },
  { tag: "Debt first", tone: "text-cat-needs bg-cat-needs/10", t: "Hit the 22% APR card before investing", d: "No portfolio reliably beats 22%.", impact: "$1,240", unit: "saved" },
  { tag: "Long game", tone: "text-brand-700 bg-brand-700/10", t: "Open a Roth IRA at $200/mo", d: "Tax-free growth, and you’re early.", impact: "+$61k", unit: "by 60" },
]

function Leaps() {
  return (
    <Section variant="canvas" id="leaps" className="scroll-mt-24">
      <Container maxWidth="wide">
        <SectionHead
          eyebrow="What a Leap looks like"
          title="Not advice. A specific move, with a number on it."
          sub="Every Leap tells you exactly what to do, what it’s worth, and why it beat the alternatives."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {LEAPS.map((l) => (
            <div
              key={l.t}
              className="rounded-card border border-hairline bg-white p-6 shadow-card transition hover:-translate-y-[3px] hover:border-lime hover:shadow-lift"
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.1em]", l.tone)}>
                  {l.tag}
                </span>
                <div className="-mt-1 shrink-0 text-right">
                  <div className={cn("text-[22px] font-extrabold leading-tight text-brand-700", NUM)}>{l.impact}</div>
                  <div className="text-[11.5px] font-semibold text-faint">{l.unit}</div>
                </div>
              </div>
              <h3 className="mb-1.5 text-[18.5px] font-extrabold leading-snug tracking-[-0.018em] text-ink">{l.t}</h3>
              <p className="text-[14.5px] leading-relaxed text-subtle">{l.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Ask Ribbit
   ========================================================================== */

const QA = [
  {
    q: "Can I afford $2,400 rent?",
    a: "On $78k, $2,400 is 44% of your take-home — past the point where saving usually stalls. At $2,050 you’d stay on track for your emergency fund and still bank about $180 a month. Want me to lay both out side by side?",
  },
  {
    q: "Roth or 401(k) first?",
    a: "401(k) up to your 6% match first — that’s an instant 100% return, and nothing else on the board beats it. After that, Roth makes sense for you: you’re likely in a lower tax bracket now than you’ll be later.",
  },
  {
    q: "Pay off my car or invest?",
    a: "Your car loan is at 4.1% — low enough that investing probably wins over time. But your emergency fund only covers 1.2 months right now. I’d get that to three months first, then put the rest to work.",
  },
  {
    q: "Am I saving enough?",
    a: "You’re at 12% of gross. Going to 15% — about $170 a month — fully funds your emergency fund by next March instead of next October. That’s the single biggest thing you could change right now.",
  },
]

function AskRibbit() {
  const [i, setI] = useState(0)
  const [fading, setFading] = useState(false)

  const pick = (n: number) => {
    if (n === i) return
    setFading(true)
    setTimeout(() => {
      setI(n)
      setFading(false)
    }, 180)
  }

  return (
    <Section variant="white" className="border-y border-hairline">
      <Container maxWidth="wide">
        <SectionHead
          eyebrow="Ask Ribbit"
          title="Or just ask, in plain English."
          sub="No jargon, no lecture about your coffee. Ribbit answers using your actual numbers."
        />

        <div className="mx-auto mt-12 max-w-[780px]">
          <div className="mb-6 flex flex-wrap justify-center gap-2.5">
            {QA.map((item, n) => (
              <button
                key={item.q}
                onClick={() => pick(n)}
                className={cn(
                  "rounded-full border px-[18px] py-2.5 text-sm font-semibold transition",
                  n === i
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-hairline bg-canvas text-ink-soft hover:border-brand-200",
                )}
              >
                {item.q}
              </button>
            ))}
          </div>

          <div className="rounded-card border border-hairline bg-canvas p-6 shadow-card">
            <div className="mb-5 flex justify-end">
              <div className="max-w-[80%] rounded-[18px] rounded-br-[4px] bg-brand-700 px-[18px] py-3 text-[15.5px] font-semibold text-white">
                {QA[i].q}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <img src="/images/ribbit.png" alt="" className="h-10 w-10 shrink-0 rounded-full bg-brand-50 p-[3px] object-contain" />
              <div
                className="min-h-[96px] rounded-[18px] rounded-bl-[4px] border border-hairline bg-white px-[18px] py-3.5 text-[15.5px] leading-relaxed text-ink-soft transition-opacity duration-200"
                style={{ opacity: fading ? 0 : 1 }}
              >
                {QA[i].a}
              </div>
            </div>

            <p className="mt-4 text-center text-[11.5px] text-faint">
              Illustrative answers. Ribbit uses your real numbers once your accounts are connected.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Net worth reveal — ported from the app's onboarding
   ========================================================================== */

const NW = { start: 10000, monthly: 500, rate: 0.07, idleRate: 0.004, years: 40 }

function buildSeries(rate: number) {
  const annual = NW.monthly * 12
  const out: number[] = []
  for (let y = 0; y <= NW.years; y++) {
    const g = Math.pow(1 + rate, y)
    out.push(NW.start * g + annual * ((g - 1) / rate))
  }
  return out
}

const money = (n: number) => `$${Math.round(Math.max(0, n)).toLocaleString("en-US")}`
const compact = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`)

function NetWorthReveal() {
  const series = React.useMemo(() => buildSeries(NW.rate), [])
  const idle = React.useMemo(() => buildSeries(NW.idleRate), [])

  const final = series[series.length - 1]
  const contributed = NW.start + NW.monthly * 12 * NW.years
  const compounded = final - contributed

  const W = 700, H = 280, PADL = 8, PADR = 8, PADT = 30, PADB = 26
  const n = series.length
  const max = Math.max(...series)
  const xAt = (idx: number) => PADL + (idx / (n - 1)) * (W - PADL - PADR)
  const yAt = (v: number) => H - PADB - (v / max) * (H - PADT - PADB)

  const lineD = series.map((v, idx) => `${idx ? "L" : "M"}${xAt(idx).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ")
  const areaD = `${lineD} L${xAt(n - 1).toFixed(1)} ${H - PADB} L${PADL} ${H - PADB} Z`
  const idleD = idle.map((v, idx) => `${idx ? "L" : "M"}${xAt(idx).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ")

  const crossIdx = (t: number) => series.findIndex((v) => v >= t)
  const i100k = crossIdx(1e5)
  const i1m = crossIdx(1e6)
  const pills = [
    i100k > 0 && { i: i100k, label: "First $100K", sub: `${i100k} years in`, big: false },
    i1m > 0 && { i: i1m, label: "Millionaire", sub: `${i1m} years in`, big: true },
    { i: n - 1, label: compact(final), sub: `${NW.years} years`, big: true },
  ].filter(Boolean) as { i: number; label: string; sub: string; big: boolean }[]

  const clipRef = useRef<SVGRectElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  // Renders finished by default: if the animation never runs, the figure is
  // still correct rather than stranded at $0.
  const [done, setDone] = useState(true)
  const [shownPills, setShownPills] = useState(pills.length)

  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const inView = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.8 && r.bottom > 0
    }
    if (inView()) return // already on screen — don't yank it back to zero

    const DUR = 3200
    let raf = 0, safety = 0, started = false

    const finish = () => {
      if (raf) cancelAnimationFrame(raf)
      clipRef.current?.setAttribute("width", String(xAt(n - 1)))
      if (tipRef.current) tipRef.current.style.opacity = "0"
      if (counterRef.current) counterRef.current.textContent = compact(final)
      setShownPills(pills.length)
      setDone(true)
    }

    const rewind = () => {
      setDone(false)
      setShownPills(0)
      clipRef.current?.setAttribute("width", "0")
      if (counterRef.current) counterRef.current.textContent = money(0)
    }

    const play = () => {
      if (started) return
      started = true
      if (tipRef.current) tipRef.current.style.opacity = "1"
      const t0 = performance.now()
      const frame = (now: number) => {
        const t = Math.min((now - t0) / DUR, 1)
        const e = 1 - Math.pow(1 - t, 3)
        const idx = Math.round(e * (n - 1))
        clipRef.current?.setAttribute("width", String(xAt(idx)))
        if (counterRef.current) counterRef.current.textContent = money(series[idx])
        if (tipRef.current) {
          tipRef.current.setAttribute("cx", String(xAt(idx)))
          tipRef.current.setAttribute("cy", String(yAt(series[idx])))
        }
        setShownPills(pills.filter((p) => idx >= p.i).length)
        if (t < 1) raf = requestAnimationFrame(frame)
        else finish()
      }
      raf = requestAnimationFrame(frame)
      safety = window.setTimeout(finish, DUR + 900) // rAF throttled? still finish
    }

    rewind()

    // Two triggers, both guarded by `started`. No blind timer — that would play
    // the animation while the visitor is still at the top of the page.
    const onScroll = () => {
      if (inView()) play()
    }
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => es[0].isIntersecting && play(), { rootMargin: "0px 0px -20% 0px" })
      io.observe(el)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      io?.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Section variant="canvas">
      <Container maxWidth="wide">
        <div className="rounded-card border border-hairline bg-white p-8 shadow-card md:p-11">
          <div className="text-center">
            <Eyebrow>The compounding part</Eyebrow>
            <h2 className="mb-6 mt-3.5 text-balance text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
              Here’s where this actually goes.
            </h2>
            <div ref={counterRef} className={cn("text-[clamp(2.8rem,6vw,4.2rem)] font-extrabold leading-none text-brand-700", NUM)}>
              {compact(final)}
            </div>
            <p className="mt-3 text-[15px] text-subtle">
              In {NW.years} years, at ${NW.monthly} a month
            </p>
          </div>

          <div ref={chartRef} className="relative mt-8 w-full">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[280px] w-full overflow-visible">
              <defs>
                <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#a7c957" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#a7c957" stopOpacity="0" />
                </linearGradient>
                <clipPath id="nwClip">
                  <rect ref={clipRef} x="0" y="-40" width={xAt(n - 1)} height={H + 80} />
                </clipPath>
              </defs>

              <line x1={PADL} y1={H - PADB} x2={W - PADR} y2={H - PADB} stroke="#e7e5dd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path
                d={idleD}
                fill="none"
                stroke="#8A9A8E"
                strokeWidth="2"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
                className="transition-opacity duration-500"
                style={{ opacity: done ? 1 : 0 }}
              />
              <g clipPath="url(#nwClip)">
                <path d={areaD} fill="url(#nwFill)" />
                <path d={lineD} fill="none" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </g>
              <circle ref={tipRef} r="5" cx={xAt(n - 1)} cy={yAt(final)} fill="#205038" style={{ opacity: 0 }} />
            </svg>

            {pills.map((p, pi) => {
              const on = pi < shownPills
              const px = xAt(p.i) / W
              const ax = px >= 0.85 ? "-100%" : px <= 0.08 ? "0%" : "-50%"
              return (
                <div
                  key={p.label}
                  className={cn(
                    "pointer-events-none absolute whitespace-nowrap rounded-full font-bold text-white transition-all duration-300",
                    p.big ? "bg-brand-700 px-[15px] py-2 text-[13px] shadow-lift" : "bg-brand-800 px-[13px] py-[7px] text-xs",
                  )}
                  style={{
                    left: `${px * 100}%`,
                    top: `${(yAt(series[p.i]) / H) * 100}%`,
                    transform: `translate(${ax}, ${on ? "-150%" : "-130%"})`,
                    opacity: on ? 1 : 0,
                  }}
                >
                  {p.label}
                  <span className="hidden font-semibold opacity-70 sm:inline">
                    {" · "}
                    {p.sub}
                  </span>
                </div>
              )
            })}

            <div
              className="absolute bottom-8 right-0 text-xs font-semibold text-[#8A9A8E] transition-opacity duration-500"
              style={{ opacity: done ? 1 : 0 }}
            >
              parked in checking · {compact(idle[idle.length - 1])}
            </div>

            <div className="mt-2 flex justify-between text-xs font-semibold text-faint">
              <span>Now</span>
              <span>10 yrs</span>
              <span>20 yrs</span>
              <span>30 yrs</span>
              <span>40 yrs</span>
            </div>
          </div>

          <div
            className="mt-9 flex items-center justify-center gap-4 rounded-[20px] border border-brand-100 bg-brand-50 px-6 py-5 transition-opacity duration-500"
            style={{ opacity: done ? 1 : 0 }}
          >
            <img src="/images/ribbit.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
            <div>
              <p className="text-[17.5px] font-bold leading-snug text-ink">
                You put in <span className="text-brand-700">{compact(contributed)}</span>. Compounding does the other{" "}
                <span className="text-brand-700">{compact(compounded)}</span>.
              </p>
              <p className="mt-1 text-sm text-subtle">That gap is the plan. Protecting it is Ribbit’s whole job.</p>
            </div>
          </div>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-faint">
            Illustrative: ${NW.start.toLocaleString()} starting balance, ${NW.monthly}/month, {(NW.rate * 100).toFixed(0)}%
            average annual return, versus {(NW.idleRate * 100).toFixed(1)}% in checking. Not a forecast — your numbers
            will differ.
          </p>
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Free tools — the GTM engine, promoted onto the homepage
   ========================================================================== */

function Tools() {
  return (
    <Section variant="white" id="tools" className="border-y border-hairline scroll-mt-24">
      <Container maxWidth="wide">
        <SectionHead
          eyebrow="Free — no signup"
          title="Try the math before you trust us with anything."
          sub="Answer the question you're actually facing, in under a minute. No account, no email wall."
        />

        {/* Leads with the three present-day decisions. From the C2 session:
            "offer is present-day, retirement is hypothetical… I'd have seen the
            first two and stopped exploring." The rest live on /tools. */}
        {/* Five present-day tools now. A four-column grid would leave the
            fifth stranded on its own row, so this centres the trailing row the
            way /tools does — 3 + 2 reads better than 4 + 1, and the layout
            survives the count changing again. */}
        <div className="mt-14 flex flex-wrap justify-center gap-5">
          {PRESENT_DAY_TOOLS.map((t) => (
            <div
              key={t.href}
              className="flex basis-full sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-13.34px)]"
            >
              <ToolCard tool={t} surface="homepage" background="canvas" headingLevel="h3" />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-full border border-brand-100 px-7 py-3.5 text-[16px] font-bold text-brand-700 transition hover:bg-brand-700/5"
          >
            See all {TOOL_COUNT_WORD} tools →
          </Link>
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Trust — the one place the dark green earns its keep
   ========================================================================== */

function Trust() {
  const items = [
    { t: "Judgment-free, always", d: "No shame about your spending, your debt, or how late you think you started." },
    { t: "You approve everything", d: "Ribbit drafts the move and shows the math. You decide. Nothing is automatic." },
    { t: "We don’t sell your data", d: "Not to advertisers, not to lenders, not to anyone. Read-only access via Plaid." },
    { t: "No ads, no credit-card pushing", d: "We don’t make money steering you into products you don’t need." },
  ]
  return (
    <Section variant="canvas">
      <Container maxWidth="wide">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#3d6b47] to-[#1c3524] p-9 md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(circle at 30% 30%, rgba(167,201,87,.20), transparent 70%)" }}
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_.52fr]">
            <div>
              <Eyebrow tone="light">Why you can relax</Eyebrow>
              <h2 className="mb-8 mt-3.5 text-balance text-[clamp(1.9rem,3.2vw,2.7rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
                Money help that won’t make you feel like an idiot.
              </h2>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {items.map((it) => (
                  <div key={it.t}>
                    <div className="mb-2 flex items-center gap-2.5">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a7c957" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-base font-bold text-white">{it.t}</span>
                    </div>
                    <p className="pl-[27px] text-[14.5px] leading-relaxed text-white/70">{it.d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden justify-center lg:flex">
              <img
                src="/images/ribbit.png"
                alt=""
                className="w-[260px]"
                style={{ filter: "drop-shadow(0 26px 40px rgba(0,0,0,.35))" }}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   FAQ
   ========================================================================== */

const FAQS = [
  { q: "What if I’m bad with money?", a: "Then you’re exactly who this is for. Ribbit doesn’t grade your spending or lecture you about takeout. It looks at where you actually are and tells you the next useful thing to do." },
  { q: "Do you move my money for me?", a: "Never without your say-so. Ribbit finds the move and shows you the math behind it — you decide whether it happens. Nothing is automatic." },
  { q: "Is my bank data safe?", a: "We connect through Plaid with read-only access — the same infrastructure your other financial apps use. We don’t store your bank login, and we don’t sell your data to anyone." },
  { q: "Are you financial advisors?", a: "No. WeLeap isn’t a registered investment adviser and doesn’t give personalised investment advice. We show you the math on your own numbers so you can make your own call — and we tell you when something is worth asking a professional about." },
  { q: "What if I’m still paying off debt?", a: "Then debt is probably your best move on the board. A 22% credit card beats almost any investment return, and Ribbit will say so instead of pushing you toward a portfolio." },
  { q: "How long does setup take?", a: "About two minutes to connect an account, and your first Leap shows up right after. There’s no long questionnaire and no budget to build." },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section variant="canvas" id="faq" className="scroll-mt-24">
      <Container maxWidth="wide">
        <SectionHead eyebrow="Questions" title="The stuff you’re actually wondering." />
        <div className="mx-auto mt-12 max-w-[780px]">
          {FAQS.map((f, n) => {
            const isOpen = open === n
            return (
              <div key={f.q} className="border-b border-hairline">
                <button
                  onClick={() => setOpen(isOpen ? null : n)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-1 py-5 text-left"
                >
                  <span className="text-[17.5px] font-bold tracking-[-0.015em] text-ink">{f.q}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden
                    className={cn("shrink-0 transition-transform duration-200", isOpen ? "rotate-180 stroke-brand-700" : "stroke-faint")}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isOpen && <p className="mb-5 max-w-[660px] pr-10 text-base leading-relaxed text-subtle">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}

/* ============================================================================
   Closing + footer
   ========================================================================== */

function Closing() {
  return (
    <>
      <Section variant="canvas" className="pt-0">
        <Container maxWidth="narrow">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="mb-4 text-balance text-[clamp(2.1rem,4vw,3.3rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              Find out what your money should be doing.
            </h2>
            <p className="mb-8 text-[18.5px] leading-relaxed text-subtle">
              Connect your accounts and get your first Leap in about two minutes.
            </p>
            <EarlyAccessDialog signupType="cta" placement="cta_section">
              <Button className="rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800">
                Get your first Leap →
              </Button>
            </EarlyAccessDialog>
            <p className="mt-4 text-[13.5px] text-faint">Free to start · No card · Cancel whenever</p>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </>
  )
}

/* ============================================================================
   Page
   ========================================================================== */

export default function Component() {
  return (
    <PageShell className="bg-canvas">
      <Hero />
      <Problem />
      <Voices />
      <How />
      <Leaps />
      <AskRibbit />
      <NetWorthReveal />
      <Tools />
      <Trust />
      <Faq />
      <Closing />
    </PageShell>
  )
}
