'use client'

import { track } from '@/lib/analytics'
import type { BioCard } from '@/lib/bio'

/**
 * The tappable column.
 *
 * A client component for one reason: the PostHog call on tap. The hrefs are
 * built on the server and arrive complete in the markup, so a tap works before
 * any JavaScript has run — which is the state an Instagram in-app browser on a
 * train is frequently in. If hydration never happens the links still go to the
 * right place with the right attribution; only the event is lost.
 *
 * Plain <a> rather than next/link. Every destination is a full page load with
 * its own attribution, and the client-side router would prefetch eleven routes
 * on a page whose whole job is to send somebody to exactly one of them.
 */
export function BioLinks({ cards }: { cards: BioCard[] }) {
  return (
    <ul className="space-y-2.5">
      {cards.map((card, index) => (
        <li key={card.href}>
          <a
            href={card.href}
            onClick={() =>
              track('bio_link_clicked', {
                destination: card.href.split('?')[0],
                slot: card.slot,
                tool: card.tool,
                position: index,
                utm_source: card.utmSource,
                utm_medium: card.utmMedium,
                utm_content: card.content,
              })
            }
            className={
              card.slot === 'featured'
                ? 'block rounded-2xl border-2 border-[#386641] bg-[#386641]/[0.06] px-4 py-3.5 active:bg-[#386641]/[0.12]'
                : 'block rounded-2xl border border-hairline bg-white px-4 py-3.5 active:bg-canvas'
            }
          >
            {card.slot === 'featured' && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#386641]">
                From this week&rsquo;s post
              </p>
            )}
            <p className="text-[15.5px] font-bold leading-tight text-ink">{card.title}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-subtle">{card.subtitle}</p>
            {card.slot !== 'app' && (
              <p className="mt-1.5 text-[12px] font-semibold text-faint">Free, no login</p>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
