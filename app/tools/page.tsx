import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import { FREE_TOOLS, TOOL_COUNT_WORD } from "@/lib/tools"
import { ToolCard } from "@/components/ToolCard"

export const metadata: Metadata = {
  title: "Free money tools",
  alternates: { canonical: "/tools" },
  description:
    "Seven free calculators that answer a real money question in under a minute. Rent affordability, offer letters, pay-in-4 decisions, credit card payoff, emergency fund and more. No account, no email wall.",
  openGraph: {
    title: "Free money tools | WeLeap",
    description:
      "Seven free calculators that answer a real money question in under a minute. No account, no email wall.",
    url: "/tools",
    images: [DEFAULT_OG_IMAGE],
  },
}

/**
 * The category comparison.
 *
 * Nowhere on the site said, in crawlable text, what category WeLeap belongs to
 * or how it differs from the two things a reader will assume it is. "Not a
 * budgeting app" appeared as a rhetorical line in a few places; the actual
 * distinction — budgeting apps report backwards, robo-advisers manage one
 * account forwards, this does neither — was never written down. A model cannot
 * infer positioning that only exists in a founder's head, and a table is the
 * form this comparison is actually in.
 */
const CATEGORIES = [
  {
    what: 'Budgeting apps',
    examples: 'Mint-style spend trackers, envelope apps',
    does: 'Categorises money you already spent and shows it back to you',
    misses: 'It tells you what happened, not what to do next',
  },
  {
    what: 'Robo-advisers',
    examples: 'Automated investing platforms',
    does: 'Manages an investment account for you, for a fee on assets',
    misses: 'It only sees the account it manages — not your debt, cash or 401(k)',
  },
  {
    what: 'WeLeap',
    examples: 'Ribbit, plus these free calculators',
    does: 'Reads the whole picture and names the single next move, which you approve',
    misses: 'It does not move money on its own and it does not manage investments',
  },
] as const

export default function ToolsPage() {
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Free · No account · No email wall
          </div>
          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            Answer one money question in under a minute.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-subtle">
            {TOOL_COUNT_WORD.charAt(0).toUpperCase() + TOOL_COUNT_WORD.slice(1)} calculators, built for decisions you're actually facing. Nothing to sign up for — use them, get your
            number, leave.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="pt-0">
        <Container maxWidth="wide">
          {/* Centred wrap rather than a grid: seven cards in three columns left
              an orphan hanging off the left of the last row. This centres the
              trailing row and survives the count changing again. */}
          <div className="flex flex-wrap justify-center gap-5">
            {FREE_TOOLS.map((t) => (
              <div
                key={t.href}
                className="flex basis-full sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-13.34px)]"
              >
                <ToolCard tool={t} surface="tools_page" background="white" headingLevel="h2" />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-card border border-brand-100 bg-brand-50 p-8 text-center md:p-10">
            <h2 className="text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              These answer one question. WeLeap answers what to do next.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16.5px] leading-relaxed text-subtle">
              Connect your accounts and Ribbit looks at the whole picture — cash, debt, 401(k), goals — then shows you
              the single move that does the most.
            </p>
            <div className="mt-7">
              <EarlyAccessDialog signupType="tools" placement="tools_cta">
                <Button className="rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800">
                  Get your first Leap →
                </Button>
              </EarlyAccessDialog>
            </div>
            <p className="mt-4 text-[13.5px] text-faint">Free to start · No card · You approve every move</p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              What is WeLeap?
            </h2>
            <p className="mb-4 max-w-3xl text-[16.5px] leading-relaxed text-subtle">
              WeLeap is a personal finance app built around <strong className="font-semibold text-ink">Ribbit</strong>,
              an AI financial sidekick for people in their twenties and early thirties. You connect your accounts
              through Plaid with read-only access, and Ribbit reads the whole picture — cash, debt, 401(k), goals —
              then names the single highest-value move to make next. That move is called a Leap. You approve it before
              anything happens; nothing is automatic and no money moves on its own.
            </p>
            <p className="mb-8 max-w-3xl text-[16.5px] leading-relaxed text-subtle">
              WeLeap is free during early access and needs no card. The {TOOL_COUNT_WORD} calculators above are free
              permanently and need no account at all. WeLeap is not a registered investment adviser, does not provide
              personalised investment advice, and does not sell your data.
            </p>

            <h3 className="mb-4 text-lg font-bold tracking-[-0.015em] text-ink">
              How WeLeap differs from budgeting apps and robo-advisers
            </h3>
            <div className="overflow-x-auto rounded-card border border-hairline bg-white">
              <table className="w-full min-w-[680px] border-collapse text-left text-[15px]">
                <caption className="sr-only">
                  Comparison of budgeting apps, robo-advisers and WeLeap: what each one does and what it does not do.
                </caption>
                <thead>
                  <tr className="border-b border-hairline bg-canvas">
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Category</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Examples</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it does</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it doesn&apos;t</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((c) => (
                    <tr key={c.what} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top font-semibold text-ink">{c.what}</th>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.examples}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.does}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.misses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-10 text-center text-[13px] leading-relaxed text-faint">
            These tools give estimates to help you think, not financial advice. WeLeap is not a registered investment
            adviser.
          </p>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
