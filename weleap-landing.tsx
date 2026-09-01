"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "./components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { cn } from "@/lib/utils"
import { PRESENT_DAY_TOOLS, TOOL_COUNT_WORD } from "@/lib/tools"
import { ToolCard } from "@/components/ToolCard"
import { HOME_FAQS } from "@/lib/home-faqs"
import { track } from "@/lib/analytics"
import { appLink } from "@/lib/app-link"
import { bucketSalary } from "@/lib/buckets"
import { formatCurrency } from "@/lib/rounding"
import { computeMatchLeap, MATCH_ASSUMPTION } from "@/lib/hero/matchLeap"

/* ============================================================================
   Shared bits
   ========================================================================== */

const NUM = "tabular-nums tracking-[-0.02em]"

/**
 * The order the engine actually builds Leaps in — match, HSA, emergency fund,
 * debt — from lib/allocator/buildLeaps.ts.
 *
 * Each locked step names the data the calculator is missing, not a feature it
 * is withholding. That distinction is the whole argument for connecting
 * accounts: these are moves a salary alone genuinely cannot rank.
 */
const LEAP_SEQUENCE = [
  { label: "Capture your full 401(k) match", needs: "" },
  { label: "Fund your HSA", needs: "needs your health plan" },
  { label: "Build your emergency fund", needs: "needs your spending" },
  { label: "Clear high-interest debt", needs: "needs your balances" },
] as const

/** Short form for the big projections. Used by the hero and the counter. */
const compact = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`)

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

/**
 * The hero is the tool.
 *
 * It used to be eight elements: a pill, a three-line headline, a 40-word
 * paragraph, two buttons, a trust line, and a carousel of three example Leaps
 * on a 5.2-second timer. Nothing was dramatically larger than anything else,
 * so a two-second glance resolved a paragraph-shaped blur — and the one
 * genuinely arresting thing on the page, a real Leap with a dollar value, was
 * rotating away before it could be read. Motion wins the eye, so attention
 * landed on the element engineered to change.
 *
 * This asks one question and answers it. The bet is the strongest pattern in
 * the tool data: people will not read a homepage, and they will answer a
 * question — the seven calculators see 78–99% completion once started. The
 * homepage now behaves like one of them instead of arguing for them.
 *
 * What it claims is bounded by what one input can support. It does NOT say
 * "you're leaving $X on the table", because it cannot know what anyone
 * currently defers. It reports the size of the prize at a stated assumption,
 * printed under the number. See lib/hero/matchLeap.ts.
 */
function Hero() {
  const [salary, setSalary] = useState("")
  const [leap, setLeap] = useState<ReturnType<typeof computeMatchLeap>>(null)
  const [touched, setTouched] = useState(false)
  const engagedRef = useRef(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const salaryNum = parseFloat(salary.replace(/[^0-9.]/g, "")) || 0
  const canCompute = computeMatchLeap(salaryNum) !== null

  const onChange = (raw: string) => {
    setSalary(raw)
    if (!engagedRef.current && raw.trim()) {
      engagedRef.current = true
      track("hero_leap_engaged", {})
    }
  }

  const compute = () => {
    setTouched(true)
    const next = computeMatchLeap(salaryNum)
    setLeap(next)
    if (next) {
      // Bucketed, never the raw figure — same rule as every other tool here.
      track("hero_leap_calculated", {
        salary_bucket: bucketSalary(salaryNum),
        leap_value_usd: Math.round(next.monthly),
      })
    }
  }

  return (
    <Section variant="canvas" isHero className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[8%] -top-32 h-[620px] w-[620px] rounded-full"
        style={{ background: "radial-gradient(circle at 35% 35%, rgba(167,201,87,.20), transparent 68%)" }}
      />
      <Container maxWidth="narrow">
        <div className="relative mx-auto max-w-[680px] text-center">
          {/* The promise is the biggest thing, and the question is second.
              This read "What's your salary?" at display size, which put a
              DEMAND where the offer should be: the largest element on a
              homepage should say what the visitor gets, not what they have to
              hand over. It also fought the product's own positioning — salary
              is the one number people will not disclose, which is the entire
              reason the share cards report a ratio instead — and it left the
              h1, the strongest on-page signal there is, carrying no product or
              category term at all.

              The interaction was right; the order was wrong. */}
          <h1 className="text-balance text-[clamp(2.3rem,5.4vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.038em] text-ink">
            Your money&rsquo;s next move.
          </h1>

          {/* The differentiator, not one Leap's benefit.
              This read "Find the free money in your paycheck", which sells the
              401(k) match — a thing Fidelity, an HR portal and every finance
              blog also say. It positioned the product as a match calculator.
              What nobody else does is the ORDER: one action at a time, ranked
              across accounts that don't talk to each other. */}
          <p className="mx-auto mt-4 max-w-[48ch] text-[17px] leading-relaxed text-subtle">
            Not a budget. Not a dashboard. One specific action at a time, in the order that
            pays most — across every account you own.
          </p>

          <form
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              compute()
            }}
          >
            {/* Visible, not sr-only. The headline used to BE the question, so
                the field could stand alone; now that the headline is a promise,
                an unlabelled box with a dollar sign is a guess. */}
            <label
              htmlFor="hero-salary"
              className="w-full text-[12.5px] font-bold uppercase tracking-[0.1em] text-subtle"
            >
              Your annual salary
            </label>
            <div className="flex items-center gap-1.5 rounded-full border-[1.5px] border-hairline bg-white px-6 py-3.5 shadow-sm focus-within:border-brand-700">
              <span aria-hidden className="text-[22px] font-semibold text-faint">$</span>
              <input
                id="hero-salary"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="72,000"
                value={salary}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                  "w-[7.5ch] bg-transparent text-[26px] font-extrabold text-ink outline-none placeholder:font-bold placeholder:text-faint",
                  NUM,
                )}
              />
            </div>
            <Button
              type="submit"
              className="rounded-full bg-brand-700 px-8 py-[18px] text-[16.5px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800"
            >
              Find my Leap →
            </Button>
          </form>

          {touched && !canCompute && (
            <p className="mt-4 text-[14px] text-subtle" role="alert">
              Enter a yearly salary — anything from $12,000 to $2,000,000.
            </p>
          )}

          {leap && (
            <div
              ref={resultRef}
              className="mt-9 rounded-card border border-hairline bg-white p-6 text-left shadow-card md:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
                <div className="min-w-[220px] flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
                    Your first Leap
                  </span>
                  <h2 className="mt-2 text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                    Capture your full 401(k) match
                  </h2>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-subtle">
                    Contribute {leap.contributionPct}% and a typical employer adds the same
                    again. It is the only guaranteed return in personal finance.
                  </p>
                </div>
                <div className="text-right">
                  <div className={cn("text-[44px] font-extrabold leading-none text-brand-700", NUM)}>
                    +{formatCurrency(leap.monthly)}
                    <span className="text-[19px] font-bold text-subtle">/mo</span>
                  </div>
                  <div className="mt-1.5 text-[13px] text-faint">
                    ≈ {compact(leap.thirtyYear)} by 60
                  </div>
                </div>
              </div>

              {/* The sequence, which is the actual differentiator.
                  A single computed Leap demonstrates that WeLeap is specific;
                  it does not demonstrate that it ORDERS. These rows do both —
                  and each locked one names the data it is missing rather than
                  teasing a feature, so the reason to connect accounts is a
                  thing the calculator genuinely cannot know rather than a
                  paywall. Order is the engine's own: match, HSA, emergency
                  fund, debt (lib/allocator/buildLeaps.ts). */}
              <ol className="mt-6 space-y-px border-t border-hairline pt-5">
                {LEAP_SEQUENCE.map((step, idx) => (
                  <li
                    key={step.label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px]",
                      idx === 0 ? "bg-brand-50" : "opacity-55",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        idx === 0 ? "bg-brand-700 text-white" : "bg-hairline text-subtle",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className={cn("flex-1", idx === 0 ? "font-bold text-ink" : "text-subtle")}>
                      {step.label}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-faint">
                      {idx === 0 ? `+${formatCurrency(leap.monthly)}/mo` : step.needs}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-5">
                <Button
                  onClick={() => {
                    track("hero_leap_cta_clicked", { salary_bucket: bucketSalary(salaryNum) })
                    window.location.href = appLink("", { src: "home_hero" })
                  }}
                  className="rounded-full bg-brand-700 px-7 py-[15px] text-[15.5px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800"
                >
                  Unlock the rest of my plan →
                </Button>
                <Link
                  href="/tools"
                  onClick={() => track("hero_tools_link_clicked", {})}
                  className="text-[14.5px] font-bold text-brand-700 underline underline-offset-4 hover:text-brand-800"
                >
                  Or try the other {TOOL_COUNT_WORD} calculators
                </Link>
              </div>

              <p className="mt-4 text-[12.5px] leading-relaxed text-faint">{MATCH_ASSUMPTION}</p>
            </div>
          )}

          {!leap && (
            <p className="mt-5 text-[13.5px] text-faint">
              Free · No account · Nothing to connect
            </p>
          )}
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
        {/* Written to read correctly whether or not the hero has been used.
            That constraint is the whole difficulty here, and two earlier
            versions failed it in opposite directions.

            "The real problem" worked when the hero POSED a problem — "you're
            not behind, you just don't have a next move" — and this section
            named it. Once the hero started ANSWERING that question, arriving
            at "the real problem" afterwards made the page argue backwards.

            "Why the rest is locked" fixed the direction and broke something
            else: it pointed at the three greyed-out rows in the hero's result,
            which only exist once someone has typed a salary. The hero is
            opt-in, so for most people scrolling past it referred to nothing on
            screen — and the sub-line asserted "we ranked your first move",
            which for those readers had not happened.

            "What one number can't tell us" then failed a plainer test: which
            number? A reader had to work out that it meant the salary the hero
            asks for. An eyebrow is read in about a quarter of a second and
            cannot carry a reference the reader has to decode.

            So it stopped trying to make the argument. The title is strong and
            self-contained, the sub-line names the salary explicitly, and the
            eyebrow now does the one job an eyebrow can do: say where in the
            argument you are. */}
        <SectionHead
          eyebrow="The hard part"
          title={
            <>
              Your money isn’t lazy.
              <br />
              It’s just unassigned.
            </>
          }
          sub="A salary is enough to rank one move. The ones after it need what a salary can’t show — your spending, your balances, your plan. Almost nobody has a single place that sees all of it at once."
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
                <Image
                  src={s.shot}
                  alt={s.alt}
                  width={s.w}
                  height={s.h}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 600px"
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
              <Image
                src="/images/ribbit.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full bg-brand-50 p-[3px] object-contain"
              />
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
            <Image
              src="/images/ribbit.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 object-contain"
            />
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
              <Image
                src="/images/ribbit.png"
                alt=""
                width={260}
                height={260}
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

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section variant="canvas" id="faq" className="scroll-mt-24">
      <Container maxWidth="wide">
        <SectionHead eyebrow="Questions" title="The stuff you’re actually wondering." />
        <div className="mx-auto mt-12 max-w-[780px]">
          {HOME_FAQS.map((f, n) => {
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
                {/* Collapsed with a grid row rather than `isOpen && …`. The
                    conditional meant five of the six answers were never in the
                    served HTML — invisible to a crawler, to an answer engine,
                    and to anyone reading with JavaScript off. The text is now
                    always in the DOM and the open/closed state is purely
                    visual. */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  {/* overflow-hidden establishes a block formatting context, so
                      the paragraph's bottom margin stays inside the collapsing
                      row instead of leaving a 20px gap under every closed
                      question. */}
                  <div className="overflow-hidden" aria-hidden={!isOpen}>
                    <p className="mb-5 max-w-[660px] pr-10 text-base leading-relaxed text-subtle">{f.a}</p>
                  </div>
                </div>
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
