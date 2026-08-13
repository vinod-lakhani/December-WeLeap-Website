'use client'

import { useEffect } from 'react'
import { BnplTool } from '@/components/BnplTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { track } from '@/lib/analytics'
import { fbqTrack } from '@/lib/meta-pixel'

export default function BnplRealityCheckPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      track('bnpl_tool_page_view', { page: '/bnpl-reality-check', tool_version: 'bnpl_v1' }, true)
    }, 500)
    fbqTrack('ViewContent', { content_name: 'bnpl_tool' })
    return () => clearTimeout(t)
  }, [])

  return (
    <PageShell className="bg-canvas">
      {/* Input first, explainer below — same sequencing as the rent and offer
          tools. Visitors arrive from social already knowing what they want. */}
      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              How much do you really owe on buy now, pay later?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Klarna shows you Klarna. Afterpay shows you Afterpay. Nobody shows you the total — or
              what it does to the paycheck it all lands on.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <BnplTool />
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
              Why the total is the number that matters
            </h2>

            <div className="space-y-8 md:space-y-10">
              {[
                {
                  n: '1',
                  t: 'Every app shows you its own slice',
                  d: 'Four plans across three apps is four separate screens, four due dates and no single number. The apps have no reason to show you the other three.',
                },
                {
                  n: '2',
                  t: 'The damage is timing, not the amount',
                  d: 'A $34 payment is nothing. A $34 payment two days before rent, on top of two others, is an overdraft. This lays the dates out against your payday.',
                },
                {
                  n: '3',
                  t: '0% stops being 0% the moment you slip',
                  d: 'A flat late fee on a small installment is a very large percentage of it. And if the payments come off a credit card you carry, they were never interest-free to begin with.',
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
                <span className="font-bold">Why this is different:</span> other calculators price a
                single purchase. This one adds up the plans you already have and shows you the week
                they collide.
              </p>
            </div>

            <p className="mt-10 text-center text-xs leading-relaxed text-faint">
              41% of buy-now-pay-later users paid a late fee in the past year
              (LendingTree, 2026).
            </p>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
