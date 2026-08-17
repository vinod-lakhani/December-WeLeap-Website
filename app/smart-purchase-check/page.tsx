'use client'

import { useEffect } from 'react'
import { SmartPurchaseTool } from '@/components/SmartPurchaseTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { track } from '@/lib/analytics'
import { fbqTrack } from '@/lib/meta-pixel'
import { ToolFaq } from '@/components/ToolExplainer'

/**
 * A real table, because this is a real comparison and a comparison rendered as
 * three prose paragraphs is one an answer engine has to reconstruct. Four
 * options, four dimensions, no marketing in any cell.
 */
const OPTIONS = [
  {
    option: 'Pay cash',
    cost: 'Sticker price, nothing more',
    cashflow: 'All of it leaves today',
    risk: 'Nothing to miss, nothing to track',
    when: 'You can cover it and the money has no other job',
  },
  {
    option: 'Pay in 4',
    cost: 'Sticker price if the plan is genuinely 0%',
    cashflow: 'A quarter today, then three payments a fortnight apart',
    risk: 'Late fees; some providers report missed payments',
    when: 'The cash it preserves is needed for something specific soon',
  },
  {
    option: 'Monthly financing',
    cost: 'Sticker price plus interest, unless the APR is 0%',
    cashflow: 'A fixed payment for the length of the term',
    risk: 'Longest commitment; often a hard credit check',
    when: 'The term is short, the APR is low, and the payment fits your surplus',
  },
  {
    option: 'Wait',
    cost: 'Nothing, plus whatever the price does',
    cashflow: 'Untouched',
    risk: 'You might not want it as much later — which is information',
    when: 'Buying it now would set back something that matters more',
  },
] as const

export default function SmartPurchaseCheckPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      track('purchase_tool_page_view', { page: '/smart-purchase-check', tool_version: 'purchase_v1' }, true)
    }, 500)
    fbqTrack('ViewContent', { content_name: 'smart_purchase_tool' })
    return () => clearTimeout(t)
  }, [])

  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              Pay now or pay in 4? Find the smarter move.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              0% financing sounds smart. Sometimes it is. This works out whether paying cash,
              splitting it, or waiting leaves you better off.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              A genuine 0% plan costs nothing in interest, so the real question is what the cash it frees up is doing
              instead. This free calculator compares four ways to fund a purchase — cash, pay in 4, monthly
              financing, or waiting — against your actual savings and monthly surplus, and tells you which one leaves
              you better off. It will say &ldquo;wait&rdquo; when none of them do.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <SmartPurchaseTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Nothing leaves your browser
          </p>
        </Container>
      </Section>

      <Section variant="white" className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink md:mb-10">
              How we pick
            </h2>

            <div className="space-y-8 md:space-y-10">
              {[
                {
                  n: '1',
                  t: 'Free financing is only worth it if the cash is doing something',
                  d: '0% costs nothing, but it is still four dates in your calendar. It earns its keep when the money it frees up is going somewhere — finishing an emergency fund, holding a deposit — and not otherwise.',
                },
                {
                  n: '2',
                  t: 'Simple wins when the options are close',
                  d: 'We will not tell you to finance something so you can earn a few dollars of savings interest. If the difference is trivial, the answer is pay cash and stop thinking about it.',
                },
                {
                  n: '3',
                  t: 'Waiting is a real answer',
                  d: 'Sometimes you can afford it and it still pulls money away from something that matters more this month. A calculator that can never say "wait" is just a financing brochure.',
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-hairline bg-canvas md:h-10 md:w-10">
                      <span className="text-sm font-semibold text-subtle md:text-base">{s.n}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-ink md:text-xl">{s.t}</h3>
                    <p className="text-base leading-relaxed text-subtle md:text-lg">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 border-l-2 border-l-brand-700/20 border-t border-hairline pl-6 pt-8 md:mt-16 md:pl-8 md:pt-10">
              <p className="text-sm leading-relaxed text-ink md:text-base">
                <span className="font-bold">What this can&apos;t see:</span> your real emergency
                fund, your retirement contributions, the goals you&apos;re part-way through. Those
                change the answer, and they need your actual accounts rather than a guess.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-balance text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              Cash vs pay in 4 vs financing vs waiting
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-subtle">
              What each option actually costs you, and the situation each one is right for.
            </p>

            {/* Its own scroll container — the page body must never scroll
                sideways on a phone just because a table is wide. */}
            <div className="overflow-x-auto rounded-card border border-hairline bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
                <caption className="sr-only">
                  Comparison of four ways to pay for a purchase: total cost, effect on cash flow, risk, and when each
                  option makes sense.
                </caption>
                <thead>
                  <tr className="border-b border-hairline bg-canvas">
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Option</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it costs</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Cash flow</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Risk</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Right when</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map((o) => (
                    <tr key={o.option} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top font-semibold text-ink">{o.option}</th>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.cost}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.cashflow}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.risk}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      <ToolFaq href="/smart-purchase-check" />

      <SiteFooter />
    </PageShell>
  )
}
