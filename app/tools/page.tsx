import type { Metadata } from "next"
import Link from "next/link"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import { FREE_TOOLS } from "@/lib/tools"

export const metadata: Metadata = {
  title: "Free money tools — WeLeap",
  description:
    "Six free calculators that answer a real money question in under a minute. Rent affordability, offer letters, credit card payoff, emergency fund, and more. No account, no email wall.",
}

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
            Six calculators, built for decisions you're actually facing. Nothing to sign up for — use them, get your
            number, leave.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="pt-0">
        <Container maxWidth="wide">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex h-full flex-col rounded-card border border-hairline bg-white p-7 shadow-card transition hover:-translate-y-[3px] hover:border-lime hover:shadow-lift"
              >
                <img src={t.icon} alt="" className="mb-5 h-12 w-12 object-contain" />
                <h2 className="mb-2 text-[19px] font-extrabold tracking-[-0.018em] text-ink">{t.name}</h2>
                <p className="mb-3 text-[15.5px] font-semibold leading-snug text-brand-700">“{t.question}”</p>
                <p className="mb-5 flex-1 text-[14.5px] leading-relaxed text-subtle">{t.blurb}</p>
                <span className="text-[13.5px] font-bold text-brand-700 group-hover:underline">Open tool →</span>
              </Link>
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
