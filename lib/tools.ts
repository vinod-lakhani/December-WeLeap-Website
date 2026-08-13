/**
 * The free tools, in one place.
 *
 * These are the top of the funnel — no signup, no email wall — so they're
 * referenced from the header, the homepage, /tools and the footer. Keeping the
 * list here stops those surfaces drifting apart.
 *
 * `question` is what a visitor is actually trying to answer, in their words.
 * It does more work on a card than a feature description does.
 *
 * `cta` is the promise of what you get, in the user's own voice — the same
 * voice as every action in the product ("Get my first Leap", "Find my target").
 * A generic "Open tool" was the one place on the site still speaking generic UI
 * voice, and it left the card's question hanging without an answer.
 *
 * `slug` is the analytics id, and deliberately matches the `tool` value each
 * tool passes to `tool_cta_clicked`. That makes card click -> tool CTA a single
 * joinable funnel rather than two unrelated event streams.
 *
 * `presentDay` marks the tools that answer a decision someone is facing right
 * now, as opposed to a projection. From the C2 research session: "offer is
 * present-day, retirement is hypothetical… I'd have seen the first two and
 * stopped exploring." The homepage leads with the present-day three for
 * exactly that reason; /tools carries the full set.
 */
export interface FreeTool {
  name: string
  question: string
  blurb: string
  cta: string
  href: string
  icon: string
  /** Analytics id — must match the `tool` value sent by this tool's AppCta. */
  slug: string
  presentDay: boolean
}

export const FREE_TOOLS: FreeTool[] = [
  {
    name: "Rent Affordability",
    question: "Can I actually afford this apartment?",
    blurb: "Turn a salary into a rent range you can live with — after tax, not before.",
    cta: "See what I can afford →",
    href: "/how-much-rent-can-i-afford",
    icon: "/images/tool-icons/home.png",
    slug: "rent",
    presentDay: true,
  },
  {
    name: "Offer Letter Analyzer",
    question: "Is this offer as good as it sounds?",
    blurb: "Seven numbers hide in an offer letter. See what the package is really worth.",
    cta: "Analyze my offer →",
    href: "/offer",
    icon: "/images/tool-icons/trophy.png",
    slug: "offer",
    presentDay: true,
  },
  {
    name: "Credit Card Payoff",
    question: "When will I finally be debt-free?",
    blurb: "Your payoff date, and how much sooner extra payments get you there.",
    cta: "Build my payoff plan →",
    href: "/credit-card-payoff",
    icon: "/images/tool-icons/move-debt.png",
    slug: "credit_card_payoff",
    presentDay: true,
  },
  {
    name: "Emergency Fund Target",
    question: "How much do I actually need saved?",
    blurb: "Not everyone needs six months. Find the number that fits your situation.",
    cta: "Find my target →",
    href: "/emergency-fund-target",
    icon: "/images/tool-icons/lock.png",
    slug: "emergency_fund",
    presentDay: false,
  },
  {
    // Was the "Leap Impact Simulator", which only ever modelled the 401(k)
    // rate and then handed off to /allocator for everything else. The
    // allocator can now start from nothing, so the two are one tool and this
    // points at the full thing. presentDay stays false only because the
    // homepage grid is three-up; flipping it is a one-line change once that
    // grid takes four.
    name: "Money Plan",
    question: "What should my money do, and in what order?",
    blurb: "Match, safety buffer, debt, retirement — and the single move worth making first.",
    cta: "Build my plan →",
    href: "/allocator",
    icon: "/images/tool-icons/rocket.png",
    slug: "allocator",
    presentDay: false,
  },
  {
    name: "Net Worth Impact",
    question: "Is $150 a month even worth it?",
    blurb: "One monthly change, compounded out to 1, 10 and 30 years.",
    cta: "See what it’s worth →",
    href: "/net-worth-impact",
    icon: "/images/tool-icons/sparkles.png",
    slug: "net_worth_impact",
    presentDay: false,
  },
]

export const PRESENT_DAY_TOOLS = FREE_TOOLS.filter((t) => t.presentDay)
