'use client'

/**
 * "The 7 numbers in your offer", each one tappable.
 *
 * These were static labels. The Purdue career-center tester pointed at exactly
 * this grid: "it would be nice if each of these numbers had a link where if I
 * clicked on the Equity box, it would scroll down on the page and tell me more
 * about how equity is factored into the calculation. Or if you hover…"
 *
 * Tap, not hover — most visitors are on a phone. One explanation open at a
 * time, shown under the grid rather than inside a chip, so a two-column grid
 * on a phone does not reflow around a paragraph. Each ends with the link down
 * to the method, which is the scroll she asked for.
 *
 * The result card's rows (components/ExplainRow) explain the visitor's own
 * numbers; these explain the seven ideas before anyone has typed one, so they
 * are general and carry no figures but the conventions the calculator uses.
 */

import { useRef, useState } from 'react'

import { track } from '@/lib/analytics'
import { MARKET_PTO_DAYS, WORKING_DAYS } from '@/lib/offer/calculate'
import { cn } from '@/lib/utils'

const NUMBERS: ReadonlyArray<{ id: string; label: string; explain: string }> = [
  {
    id: 'base',
    label: 'Base salary',
    explain:
      'The salary in the letter, before tax. It is usually only 70% to 90% of what an offer is worth, which is why the other six exist. The calculator starts from what it leaves after federal, state and FICA tax, because that is the number you live on.',
  },
  {
    id: 'bonus',
    label: 'Bonus target',
    explain:
      'Salary × the target percentage in the letter. A target, not a promise: most bonuses depend on how the company and you perform, so the calculator counts it in full and calls it a target.',
  },
  {
    id: 'match',
    label: '401k match',
    explain:
      'Employer money you only get if you contribute. "50% of the first 6%" means put in 6% of your salary and the employer adds half of that. The calculator assumes you contribute up to the cap; contribute less and you leave the difference behind, and it never backfills.',
  },
  {
    id: 'hsa',
    label: 'HSA & benefits',
    explain:
      'What the employer puts into your health savings account each year, minus what you pay for health insurance out of each paycheck. Two offers with the same salary can be thousands apart here.',
  },
  {
    id: 'equity',
    label: 'Equity',
    explain:
      'Stock that vests over time, often four years. The calculator counts one year of it at the value the letter states. That is face value: the shares can be worth more or less on the day they vest, and they are taxed as income then. With an ESPP, only the discount counts.',
  },
  {
    id: 'pto',
    label: 'Time off',
    explain: `Paid days off above the ${MARKET_PTO_DAYS}-day norm, valued at a day of your pay: salary ÷ ${WORKING_DAYS} working days. Paid time off is pay for days you do not work, so extra days are worth real money.`,
  },
  {
    id: 'housing',
    label: 'Housing cost',
    explain:
      'Rent in the city you would live in, prefilled with the local market rate. Not part of the package, but set next to your take-home, because the same salary leaves very different amounts in different cities.',
  },
]

export function OfferNumberChips() {
  const [open, setOpen] = useState<string | null>(null)
  const seen = useRef(new Set<string>())
  const current = NUMBERS.find((n) => n.id === open)

  return (
    <div>
      <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        {NUMBERS.map((item, i) => {
          const active = open === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-expanded={active}
              aria-controls="offer-number-explain"
              onClick={() => {
                setOpen(active ? null : item.id)
                if (!active && !seen.current.has(item.id)) {
                  seen.current.add(item.id)
                  track('tool_row_explained', { tool: 'offer', row: item.id, surface: 'number_chips' })
                }
              }}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition',
                active ? 'border-[#386641] bg-[#F3F7F3]' : 'border-gray-200 bg-white hover:border-[#386641]',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#386641] text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              <span
                aria-hidden
                className="ml-auto inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-gray-300 text-[9.5px] font-bold leading-none text-gray-400"
              >
                {active ? '−' : 'i'}
              </span>
            </button>
          )
        })}
      </div>
      {current ? (
        <div id="offer-number-explain" className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[14px] leading-relaxed text-gray-700">
          <strong className="font-bold text-gray-900">{current.label}.</strong> {current.explain}{' '}
          <a href="#method" className="whitespace-nowrap font-semibold text-[#386641] underline underline-offset-2">
            How it&apos;s worked out ↓
          </a>
        </div>
      ) : (
        <p className="mt-2 text-center text-[12.5px] text-gray-400">Tap any of them to see how it&apos;s counted.</p>
      )}
    </div>
  )
}
