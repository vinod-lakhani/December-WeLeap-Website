import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TOOL_COUNT } from "@/lib/tools"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'What WeLeap costs, and what you get for it. Start free — the tools need no account at all.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | WeLeap',
    description: 'What WeLeap costs, and what you get for it. Start free — the tools need no account at all.',
    url: '/pricing',
    images: [DEFAULT_OG_IMAGE],
  },
}


const NOW = [
  "Your weekly Leap — the single move that does the most",
  "Full picture: cash, debt, 401(k), goals",
  "Ask Ribbit anything, in plain English",
  // Was hardcoded "six" while the site shipped seven, on the one page whose
  // job is to say accurately what you get.
  `All ${TOOL_COUNT} planning tools`,
]

const FOUNDING = [
  "Recognition as a founding supporter",
  "Priority support",
  "Locked-in pricing — our lowest rate, for life",
]

const FAQS = [
  {
    q: "Do you have multiple plans?",
    a: "Not right now. Everyone gets the same experience, free, during early access. We'll introduce paid plans once we've earned it — and Founding Members keep their perks and lock in the lowest rate.",
  },
  {
    q: "Who is a Founding Member?",
    a: "The first 500 signups, automatically. No extra step and no checkout — it's a thank-you for helping us build.",
  },
  {
    q: "How do you make money?",
    a: "Eventually, a simple subscription. If we ever earn a referral fee from a financial product, we disclose it on the spot. We never earn more by steering you toward a worse option — that's the whole point.",
  },
  {
    q: "Do you move my money?",
    a: "Never without your say-so. Ribbit finds the move and shows you the math behind it. You decide whether it happens.",
  },
  {
    q: "Is my financial data secure?",
    a: "We connect through Plaid with read-only access — the same infrastructure your other financial apps use. We don't store your banking credentials, and we don't sell your data.",
  },
  {
    q: "What if it doesn't work for me?",
    a: "Early access is free, so there's nothing to lose by trying. When paid plans launch we'll publish a clear guarantee policy.",
  },
]

export default function PricingPage() {
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Free during early access · No card required
          </div>
          <h1 className="text-balance text-[clamp(2.4rem,4.35vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
            Free while we earn it.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-subtle">
            One experience, free during early access. We'll introduce paid plans only once the product has proven
            itself — and the first 500 members lock in our lowest rate for life.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="pt-0">
        <Container maxWidth="wide">
          <div className="mx-auto max-w-4xl rounded-card border border-hairline bg-white p-8 shadow-card md:p-11">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">Early access</div>
              <div className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-[64px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">$0</span>
              </div>
              <p className="mt-3 text-[15px] text-subtle">Free during the early access period</p>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 text-lg font-extrabold tracking-[-0.018em] text-ink">What you get today</h2>
                <ul className="space-y-3">
                  {NOW.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
                      <span className="text-[15px] leading-snug text-ink-soft">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-4 text-lg font-extrabold tracking-[-0.018em] text-ink">What the first 500 keep</h2>
                <ul className="space-y-3">
                  {FOUNDING.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
                      <span className="text-[15px] leading-snug text-ink-soft">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5">
                  <p className="mb-1 text-[15px] font-bold text-ink">What happens after early access?</p>
                  <p className="text-[14.5px] leading-relaxed text-subtle">
                    We'll introduce paid plans only once we've earned it. Founding Members keep their perks and lock in
                    our lowest possible rate for life.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <EarlyAccessDialog signupType="pricing" placement="pricing_cta">
                <Button className="w-full rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800 sm:w-auto">
                  Get your first Leap →
                </Button>
              </EarlyAccessDialog>
              <Link
                href="/resources/pricing-philosophy"
                className="w-full rounded-full border border-brand-100 px-8 py-[17px] text-center text-[17px] font-bold text-brand-700 transition hover:bg-brand-700/5 sm:w-auto"
              >
                Read our pricing philosophy
              </Link>
            </div>

            <p className="mt-5 text-center text-[13.5px] text-faint">
              Free to start · No card · You approve every move
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-[780px]">
            <h2 className="mb-10 text-center text-balance text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
              Questions about pricing.
            </h2>
            <div className="grid gap-4">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-card border border-hairline bg-white p-6 shadow-card">
                  <h3 className="mb-2 text-[17.5px] font-bold tracking-[-0.015em] text-ink">{f.q}</h3>
                  <p className="text-[15.5px] leading-relaxed text-subtle">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
