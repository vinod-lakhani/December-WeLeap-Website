import Link from 'next/link'
import { Section, Container } from '@/components/layout'
import { TOOL_COUNT } from '@/lib/tools'
import { TOOL_FAQS, type FaqItem } from '@/lib/tool-faqs'

/**
 * The prose that surrounds a calculator.
 *
 * Six of the seven tool routes used to be an <h1>, two sentences and a widget —
 * about twenty-five words of text, all of it marketing. That is fine for a
 * visitor who arrived knowing what they wanted and useless to anything trying
 * to work out what the page computes: a search engine, an answer engine, or a
 * person who landed on it from a query rather than a link.
 *
 * Three components, all plain server-rendered markup:
 *
 *  - `MethodSteps` — numbered explanation of what the calculator actually does,
 *    matching the pattern /how-much-rent-can-i-afford already used.
 *  - `ToolFaq` — question-shaped H3s with a self-contained answer under each.
 *  - `Caveat` — what the calculator cannot see, which is the honest framing for
 *    the app CTA and is also the part people quote.
 *
 * Nothing here collapses, toggles or waits for hydration. An accordion whose
 * closed panels are absent from the HTML hides the answer from exactly the
 * consumers this copy exists for, and that is not a hypothetical: the FAQ on
 * /net-worth-impact was a Radix accordion, so four of its five answers were not
 * in the served markup at all.
 */

export interface MethodStep {
  t: string
  d: string
}

export function MethodSteps({
  heading,
  intro,
  steps,
}: {
  heading: string
  intro?: string
  steps: readonly MethodStep[]
}) {
  return (
    <Section variant="white" className="bg-white">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-balance text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
            {heading}
          </h2>
          {intro && (
            <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-subtle md:mb-12 md:text-lg">
              {intro}
            </p>
          )}

          <div className="space-y-8 md:space-y-10">
            {steps.map((s, i) => (
              <div key={s.t} className="flex gap-4 md:gap-5">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-hairline bg-canvas md:h-10 md:w-10">
                    <span className="text-sm font-semibold text-subtle md:text-base">{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-ink md:text-xl">{s.t}</h3>
                  <p className="text-base leading-relaxed text-subtle md:text-lg">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

export function Caveat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Section variant="white" className="bg-white pt-0">
      <Container>
        <div className="mx-auto max-w-3xl border-l-2 border-l-brand-700/20 border-t border-hairline pl-6 pt-8 md:pl-8 md:pt-10">
          <p className="text-sm leading-relaxed text-ink md:text-base">
            <span className="font-bold">{label}</span> {children}
          </p>
        </div>
      </Container>
    </Section>
  )
}

/**
 * Renders the FAQ for a route straight out of TOOL_FAQS.
 *
 * The route is passed rather than the items, so the page cannot render one set
 * of questions while the layout emits FAQPage markup for another — they both
 * key off the same href into the same object.
 */
export function ToolFaq({
  href,
  heading = 'Questions people actually ask',
}: {
  href: string
  heading?: string
}) {
  const items: readonly FaqItem[] | undefined = TOOL_FAQS[href]
  if (!items || items.length === 0) return null

  return (
    <Section variant="canvas">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-balance text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink md:mb-10">
            {heading}
          </h2>
          <div className="space-y-8">
            {items.map((item) => (
              <div key={item.q} className="border-t border-hairline pt-6 first:border-t-0 first:pt-0">
                <h3 className="mb-2.5 text-[17.5px] font-bold tracking-[-0.015em] text-ink md:text-lg">
                  {item.q}
                </h3>
                <p className="text-base leading-relaxed text-subtle">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-[13.5px] leading-relaxed text-faint">
            Estimates to help you think, not financial advice.{' '}
            <Link href="/tools" className="underline underline-offset-2 hover:text-brand-700">
              See all {TOOL_COUNT} free calculators
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  )
}
