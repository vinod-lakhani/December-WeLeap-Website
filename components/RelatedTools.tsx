'use client'

import Link from 'next/link'
import { Section, Container } from '@/components/layout'
import { FREE_TOOLS } from '@/lib/tools'
import { track } from '@/lib/analytics'

/**
 * Contextual links from one calculator to two or three others.
 *
 * The tools are at flat top-level routes, so internal linking is doing all the
 * work that URL nesting would otherwise do: without it,
 * /what-is-my-job-offer-worth and /how-should-i-split-my-paycheck are seven
 * unrelated pages that happen to share a footer. The `why` line is
 * per-page rather than reused from the tool's blurb, because the reason to go
 * from an offer to the rent calculator is not the reason to go there from the
 * homepage, and a link whose anchor explains the specific next step is the only
 * kind worth having.
 *
 * A client component solely so the cross-sell click is measurable. The anchors
 * are still server-rendered — this is not a hydration-gated block — and
 * `tool_cross_sell_clicked` is the event the offer tool's in-widget rent link
 * already uses, so both paths land in one stream.
 */

export interface RelatedTool {
  /** Route of the tool to link to — must exist in FREE_TOOLS. */
  href: string
  /** Why a reader of *this* page would want that one, in one sentence. */
  why: string
}

export function RelatedTools({
  from,
  items,
  heading = 'Related calculators',
  intro,
}: {
  /** Analytics slug of the page the link is leaving. */
  from: string
  items: readonly RelatedTool[]
  heading?: string
  intro?: string
}) {
  const resolved = items
    .map((item) => ({ ...item, tool: FREE_TOOLS.find((t) => t.href === item.href) }))
    .filter((item): item is RelatedTool & { tool: (typeof FREE_TOOLS)[number] } => !!item.tool)

  if (resolved.length === 0) return null

  return (
    <Section variant="white">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-3 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
            {heading}
          </h2>
          {intro && <p className="mb-8 text-base leading-relaxed text-subtle md:text-lg">{intro}</p>}

          <ul className="space-y-4">
            {resolved.map(({ tool, why }) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  onClick={() =>
                    track('tool_cross_sell_clicked', { from, to: tool.slug, surface: 'related_tools' })
                  }
                  className="group flex flex-col gap-1 rounded-card border border-hairline bg-canvas p-5 transition hover:-translate-y-[2px] hover:border-lime hover:shadow-card"
                >
                  <span className="text-[16.5px] font-bold tracking-[-0.015em] text-brand-700 group-hover:underline">
                    {tool.name}
                  </span>
                  <span className="text-[15px] leading-relaxed text-subtle">{why}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-[15px] leading-relaxed text-subtle">
            All of them are free and need no account.{' '}
            <Link
              href="/tools"
              onClick={() => track('tool_cross_sell_clicked', { from, to: 'tools_index', surface: 'related_tools' })}
              className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Browse every WeLeap money calculator
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  )
}
