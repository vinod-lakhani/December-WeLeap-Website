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
// Per flow, chosen on the server from the address so crawlers read it in the page source (the rent ads land on
// `?flow=rent`). Rent has its own title, description and explainer; offer, money and the picker keep the generic page.
// `openGraph.title` stays byte-identical to what `title` renders through the root layout's `%s | WeLeap` template;
// checked by scripts/checkMetadata.js.
const GENERIC_META = {
  title: 'Work it out with Ribbit',
  description: 'Rent you can afford, or what a job offer is really worth, worked out one question at a time with Ribbit from WeLeap.',
  ogDescription: 'Rent you can afford, or what a job offer is really worth, worked out one question at a time.',
  url: '/ribbit_chat',
}
const RENT_META = {
  title: 'How much rent can I afford? Work it out with Ribbit',
  description:
    'See what rent your take-home pay supports, not just your salary. Answer a few questions and get a rent range, worked out one step at a time. Free, no login.',
  ogDescription:
    'See what rent your take-home pay supports, not just your salary. Answer a few questions and get a rent range, worked out one step at a time.',
  url: '/ribbit_chat?flow=rent',
}

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const page = readFlow(searchParams).flow === 'rent' ? RENT_META : GENERIC_META
  return {
    title: page.title,
    description: page.description,
    robots: CAMPAIGN_ROBOTS,
    openGraph: { title: `${page.title} | WeLeap`, description: page.ogDescription, url: page.url },
  }
}

type SearchParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function readFlow(sp: SearchParams | undefined): { flow: Flow | null; entry: 'flow_param' | 'utm' | 'picker' } {
  const flow = one(sp?.flow)
  if (flow === 'rent' || flow === 'offer' || flow === 'money') return { flow, entry: 'flow_param' }
  const content = one(sp?.utm_content) ?? ''
  if (content.startsWith('rent-')) return { flow: 'rent', entry: 'utm' }
  if (content.startsWith('offer-')) return { flow: 'offer', entry: 'utm' }
  return { flow: null, entry: 'picker' }
}

const HEADER: Record<Flow | 'picker', string> = {
  rent: 'What rent can I afford?',
  offer: 'What is my job offer really worth?',
  money: 'Where should my money go?',
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
      {flow === 'rent' && <RentExplainer />}
    </PageShell>
  )
}

/** Server-rendered below the chat (never by the chat's script), so the rent page's content is in its source. */
function RentExplainer() {
  return (
    <Section variant="canvas" className="!pt-0">
      <Container maxWidth="narrow">
        <article className="mx-auto max-w-[480px] space-y-3 border-t border-hairline pt-8 text-[15px] leading-relaxed text-subtle">
          <h2 className="text-[1.25rem] font-bold leading-snug tracking-[-0.01em] text-ink">How much rent can you afford?</h2>
          <p>
            Most rent advice starts from your salary. What you can actually spend starts from your take-home pay: what
            lands after federal and state tax, FICA, health insurance and any 401(k) contribution. For many people in a
            first job, take-home is roughly 70 to 78% of gross pay, so the same salary supports different rents in
            different states.
          </p>
          <p>
            The 30% rule is a common starting point: rent at or under 30% of income. It is a rule of thumb from 1960s
            housing policy, not a fit for every budget. If you carry student loans, or want room to save, a lower share of
            take-home can feel more comfortable.
          </p>
          <p>
            Moving in usually costs more than the first month. Deposits, first month&apos;s rent and fees often add up to
            three to four times the monthly rent before you get the keys.
          </p>
          <p>
            Ribbit works out a rent range from your own numbers: your salary or take-home, where you live, and what you
            already pay each month. General answers from your numbers, not personal financial advice.
          </p>
        </article>
      </Container>
    </Section>
  )
}
