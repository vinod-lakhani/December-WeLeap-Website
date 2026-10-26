import type { Metadata } from 'next'

import { PageShell, Section, Container } from '@/components/layout'
import { RibbitChat } from '@/components/RibbitChat'
import { CAMPAIGN_ROBOTS } from '@/lib/campaign'
import type { Flow } from '@/lib/ribbit/engine'

/**
 * /ribbit_chat — the rent and offer tools as a conversation with Ribbit (spec: "Ribbit Chat Tool — Rent and Offer
 * Flows"). Its own page so it can run in parallel with everything else: the tool pages and the text pilot on
 * /rent_text and /offer_text are untouched. A destination for links and ads, not a search page: noindex but
 * crawlable, out of the sitemap and the tools grid.
 *
 * The flow is read on the server at the first load: `flow`, then `utm_content` (rent-* / offer-*, as the Posting
 * Table links carry), then a one-question picker.
 */
export const metadata: Metadata = {
  title: 'Work it out with Ribbit',
  description: 'Rent you can afford, or what a job offer is really worth, worked out one question at a time with Ribbit from WeLeap.',
  robots: CAMPAIGN_ROBOTS,
  // Byte-identical to what `title` renders through the root layout's `%s | WeLeap` template; checked by
  // scripts/checkMetadata.js.
  openGraph: {
    title: 'Work it out with Ribbit | WeLeap',
    description: 'Rent you can afford, or what a job offer is really worth, worked out one question at a time.',
    url: '/ribbit_chat',
  },
}

type SearchParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function readFlow(sp: SearchParams | undefined): { flow: Flow | null; entry: 'flow_param' | 'utm' | 'picker' } {
  const flow = one(sp?.flow)
  if (flow === 'rent' || flow === 'offer') return { flow, entry: 'flow_param' }
  const content = one(sp?.utm_content) ?? ''
  if (content.startsWith('rent-')) return { flow: 'rent', entry: 'utm' }
  if (content.startsWith('offer-')) return { flow: 'offer', entry: 'utm' }
  return { flow: null, entry: 'picker' }
}

const HEADER: Record<Flow | 'picker', string> = {
  rent: 'What rent can I afford?',
  offer: 'What is my job offer really worth?',
  picker: 'Work it out with Ribbit',
}

export default function Page({ searchParams }: { searchParams?: SearchParams }) {
  const { flow, entry } = readFlow(searchParams)
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" isHero className="!pb-8">
        <Container maxWidth="narrow">
          <div className="mx-auto max-w-[480px]">
            <h1 className="text-balance text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
              {HEADER[flow ?? 'picker']}
            </h1>
            {/* The disclaimer, once: it does not repeat in the thread. */}
            <p className="mt-2 text-[14px] leading-relaxed text-subtle">
              Ribbit works it out with you, one question at a time. General answers from your numbers, not personal
              financial advice.
            </p>
            <div className="mt-6">
              <RibbitChat initialFlow={flow} entry={entry} />
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
