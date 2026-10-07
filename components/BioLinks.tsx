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
            /**
             * One filled card, and it is the app.
             *
             * Everything else is outlined white, so the single green block is
             * the only thing on the page the eye cannot skip. That is the
             * right card to spend it on: the ten tools are chosen by somebody
             * who already knows which one they came for, and the app is the
             * one row that is relevant whatever brought them.
             *
             * The featured card, when it is switched back on, keeps the
             * outlined treatment and earns its prominence from its eyebrow and
             * its position instead. Two emphasised cards is none.
             */
            className={
              card.slot === 'app'
                ? 'block rounded-2xl bg-[#386641] px-4 py-4 shadow-card active:bg-[#2d5235]'
                : 'block rounded-2xl border border-hairline bg-white px-4 py-3.5 active:bg-canvas'
            }
          >
            {card.slot === 'featured' && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#386641]">
                From this week&rsquo;s post
              </p>
            )}
            <p
              className={
                card.slot === 'app'
                  ? 'text-[16px] font-bold leading-tight text-white'
                  : 'text-[15.5px] font-bold leading-tight text-ink'
              }
            >
              {card.title}
            </p>
            <p
              className={
                card.slot === 'app'
                  ? 'mt-1 text-[13.5px] leading-snug text-white/85'
                  : 'mt-1 text-[13.5px] leading-snug text-subtle'
              }
            >
              {card.subtitle}
            </p>
            {card.slot !== 'app' && (
              <p className="mt-1.5 text-[12px] font-semibold text-faint">Free, no login</p>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
