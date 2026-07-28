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
  href: string
  icon: string
  presentDay: boolean
}

export const FREE_TOOLS: FreeTool[] = [
  {
    name: "Rent Affordability",
    question: "Can I actually afford this apartment?",
    blurb: "Turn a salary into a rent range you can live with — after tax, not before.",
    href: "/how-much-rent-can-i-afford",
    icon: "/images/tool-icons/home.png",
    presentDay: true,
  },
  {
    name: "Offer Letter Analyzer",
    question: "Is this offer as good as it sounds?",
    blurb: "Seven numbers hide in an offer letter. See what the package is really worth.",
    href: "/offer",
    icon: "/images/tool-icons/trophy.png",
    presentDay: true,
  },
  {
    name: "Credit Card Payoff",
    question: "When will I finally be debt-free?",
    blurb: "Your payoff date, and how much sooner extra payments get you there.",
    href: "/credit-card-payoff",
    icon: "/images/tool-icons/move-debt.png",
    presentDay: true,
  },
  {
    name: "Emergency Fund Target",
    question: "How much do I actually need saved?",
    blurb: "Not everyone needs six months. Find the number that fits your situation.",
    href: "/emergency-fund-target",
    icon: "/images/tool-icons/lock.png",
    presentDay: false,
  },
  {
    name: "Leap Impact Simulator",
    question: "What would one change actually do?",
    blurb: "Pick a single move and watch it play out over thirty years.",
    href: "/leap-impact-simulator",
    icon: "/images/tool-icons/rocket.png",
    presentDay: false,
  },
  {
    name: "Net Worth Impact",
    question: "Is $150 a month even worth it?",
    blurb: "One monthly change, compounded out to 1, 10 and 30 years.",
    href: "/net-worth-impact",
    icon: "/images/tool-icons/sparkles.png",
    presentDay: false,
  },
]

export const PRESENT_DAY_TOOLS = FREE_TOOLS.filter((t) => t.presentDay)
