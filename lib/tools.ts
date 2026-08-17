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
    href: "/what-is-my-job-offer-worth",
    icon: "/images/tool-icons/trophy.png",
    slug: "offer",
    presentDay: true,
  },
  {
    name: "Smart Purchase Check",
    question: "Should I use buy now, pay later?",
    blurb: "Cash, pay in 4, or monthly financing — see which one actually leaves you better off.",
    cta: "Find the smarter move →",
    // Renamed from /smart-purchase-check, which was the internal product name
    // for the decision engine and matches nothing anyone types. 308 in
    // next.config.mjs. Same reasoning as /offer and /allocator above: on a site
    // whose tools sit at flat top-level routes, the slug is the strongest
    // on-page signal, so it now says the query the page targets.
    //
    // `slug` deliberately stayed "smart_purchase" — it is the analytics id
    // every event in this tool's funnel joins on, and it did not move with the
    // URL. `name` stayed too: it is the card label, the breadcrumb leaf, the OG
    // card headline and the schema `name`, and "Offer Letter Analyzer" on
    // /what-is-my-job-offer-worth is the same arrangement.
    href: "/should-i-use-buy-now-pay-later",
    icon: "/images/tool-icons/smart-purchase.png",
    slug: "smart_purchase",
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
    // rate and then handed off to the allocation engine for everything else.
    // That engine can now start from nothing, so the two are one tool and this
    // points at the full thing.
    //
    // Present-day despite sounding like planning: it opens on "you are leaving
    // $3,400 a year of your employer's money behind", which is a thing that is
    // true today, not a projection.
    name: "Money Plan",
    // Was "What should my money do, and in what order?". The ordering question
    // is answered by prose — every list-shaped result already owns it — while
    // the thing this tool alone does is take a real paycheck and split it. The
    // card now asks the question the page is targeting, and the blurb below
    // still says the order, so both signals survive on one card.
    question: "How should I split my paycheck?",
    blurb: "Match, safety buffer, debt, retirement — and the single move worth making first.",
    cta: "Build my plan →",
    // Renamed from /allocator, which was the internal name for the engine and
    // matched nothing anyone types. 308 in next.config.mjs. `slug` deliberately
    // stayed "allocator": it is the analytics id, and every event and saved
    // report keyed on it would otherwise lose its own history.
    href: "/how-should-i-split-my-paycheck",
    icon: "/images/tool-icons/rocket.png",
    slug: "allocator",
    presentDay: true,
  },
  {
    name: "Net Worth Impact",
    // Was "Is $150 a month even worth it?". The amount is this tool's default,
    // not its subject — it is a slider — and the card, the OG card headline and
    // the H1 all had to be re-edited together every time someone thought about
    // changing it. The question now says the thing that does not move, and is
    // one of the phrasings the page targets.
    question: "Is saving a small amount worth it?",
    blurb: "One monthly change, compounded out to 1, 10 and 30 years.",
    cta: "See what it’s worth →",
    // Renamed from /net-worth-impact, the internal name for the projection:
    // it describes the output rather than the question, and nobody types it.
    // 308 in next.config.mjs. Same reasoning as /offer, /allocator and
    // /smart-purchase-check above. No dollar figure in the slug, deliberately —
    // the default amount can change without costing another redirect.
    //
    // `slug` deliberately stayed "net_worth_impact": it is the analytics id
    // every event in this tool's funnel joins on, and it did not move with the
    // URL. `name` stayed too — it is the card label, the breadcrumb leaf and
    // the schema `name`.
    href: "/what-is-saving-monthly-worth",
    icon: "/images/tool-icons/sparkles.png",
    slug: "net_worth_impact",
    presentDay: false,
  },
]

export const PRESENT_DAY_TOOLS = FREE_TOOLS.filter((t) => t.presentDay)

/**
 * Copy on three surfaces used to hardcode "Six calculators". Adding a seventh
 * meant three separate edits, and missing one would ship a wrong count to a
 * visitor who can see the grid. Derived instead.
 */
export const TOOL_COUNT = FREE_TOOLS.length
export const TOOL_COUNT_WORD =
  ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][
    TOOL_COUNT
  ] ?? String(TOOL_COUNT)
