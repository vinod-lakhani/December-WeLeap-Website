'use client'

/**
 * The three counters worth making, priced off this offer.
 *
 * Sits between the result and the CTA because that is where the visitor
 * actually is: they know what the offer is worth, and they are about to accept,
 * counter or walk, this week. Everything above this block describes the offer;
 * this is the only part that tells them what to do about it.
 */

import Link from 'next/link'

import { track } from '@/lib/analytics'
import type { Cadence, Lever } from '@/lib/offer/levers'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

const SUFFIX: Record<Cadence, string> = {
  monthly: '/mo',
  annual: '/yr',
  once: ' once',
}

export function OfferLevers({ levers, fromLetter }: { levers: Lever[]; fromLetter: boolean }) {
  if (levers.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 md:px-6">
      {/* The permission, before the arithmetic. This card always priced each
          ask, and the Purdue career-center tester read it as a calculation,
          not as encouragement: "a lot of early career professionals make the
          mistake of settling for what they're given and not even trying to
          negotiate." So it says the thing first, and links the how-to. */}
      <p className="mb-3 rounded-lg bg-[#F3F7F3] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-gray-800">
        <strong className="font-bold">If this is the first number they gave you, it isn&apos;t the last.</strong>{' '}
        Asking, politely, is a normal part of accepting an offer — and a higher starting base is carried into every
        raise after it.{' '}
        <Link
          href="/resources/negotiate-your-offer"
          onClick={() => track('offer_negotiation_guide_clicked', { tool: 'offer' })}
          className="whitespace-nowrap font-semibold text-[#386641] underline underline-offset-2"
        >
          How to ask →
        </Link>
      </p>
      <h3 className="text-lg font-extrabold leading-tight tracking-[-0.015em] text-gray-900">
        Before you counter, know which ask moves the number
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-500">
        {/* Only claim the letter when a letter was actually read. The same
            mistake the field-provenance badges exist to prevent: telling
            somebody a figure came off a document they never uploaded. */}
        {fromLetter
          ? 'Each one computed from the letter you uploaded, so you can ask for the right thing.'
          : 'Each one computed from the numbers above, so you can ask for the right thing.'}
      </p>

      <ul className="mt-5 space-y-3">
        {levers.map((lever) => (
          <li
            key={lever.id}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition hover:border-[#A7C957]"
            onMouseEnter={() => track('offer_lever_viewed', { tool: 'offer', lever: lever.id })}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-[14.5px] font-bold text-gray-900">{lever.ask}</span>
              <span className="whitespace-nowrap text-[15.5px] font-black tabular-nums text-[#386641]">
                {lever.cadence === 'once' ? 'About ' : '+'}
                {fc(lever.amount)}
                {SUFFIX[lever.cadence]}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{lever.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12.5px] leading-relaxed text-gray-400">
        Estimates for planning, not negotiating advice. This page has no salary benchmark data and cannot tell
        you whether an offer is competitive for your role or your market.
      </p>
    </div>
  )
}
