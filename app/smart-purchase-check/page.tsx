'use client'

import { useEffect } from 'react'
import { SmartPurchaseTool } from '@/components/SmartPurchaseTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { track } from '@/lib/analytics'
import { fbqTrack } from '@/lib/meta-pixel'

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

      <SiteFooter />
    </PageShell>
  )
}
