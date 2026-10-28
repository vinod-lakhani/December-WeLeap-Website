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
 * Once the tool above has a result, each one also shows THIS visitor's figure
 * — "Your offer: $20,000 a year" — read from the same entered-data values the
 * result card shows (lib/offer/liveFigures), so a chip never states a number
 * the card does not. A term they have not entered says so, rather than
 * showing an example.
 *
 * Hover opens a card beside the chip on a desktop, which is what the tester
 * asked for; a tap opens the same content under the grid, which is what a
 * phone can do.
 */

import { useRef, useState } from 'react'

import { track } from '@/lib/analytics'
import { MARKET_PTO_DAYS, WORKING_DAYS } from '@/lib/offer/calculate'
import { useOfferFigures, type OfferFigures } from '@/lib/offer/liveFigures'
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

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(n)),
  )
const signed = (n: number) => (n < 0 ? `−${usd(n)}` : usd(n))
const NOT_ENTERED = 'Not entered yet. Add it in Refine your package above.'

/** This visitor's figure for one chip, or null before there is a result. */
export function yourFigure(id: string, f: OfferFigures | null): string | null {
  if (!f) return null
  switch (id) {
    case 'base':
      return `${usd(f.salary)} a year, about ${usd(f.takeHomeMonthly)} a month after tax.`
    case 'bonus':
      return f.bonusEntered ? `${usd(f.annualBonus)} a year (a ${f.bonusPct}% target).` : NOT_ENTERED
    case 'match':
      return f.matchEntered
        ? `${usd(f.annual401kMatch)} a year (${f.matchRatePct}% up to ${f.matchUpToPct}% of salary).`
        : NOT_ENTERED
    case 'hsa': {
      if (!f.benefitsEntered) return NOT_ENTERED
      const net = f.annualHsa + f.annualHealthcare
      return `${usd(f.annualHsa)} into your HSA, ${signed(f.annualHealthcare)} in premiums: ${signed(net)} a year.`
    }
    case 'equity':
      if (!f.equityEntered) return NOT_ENTERED
      return f.annualEspp > 0
        ? `${usd(f.rsuAnnual)} a year in stock, plus ${usd(f.annualEspp)} from the ESPP discount.`
        : `${usd(f.rsuAnnual)} a year.`
    case 'pto':
      if (!f.ptoEntered) return `Not entered yet, so counted at the ${MARKET_PTO_DAYS}-day norm: $0 extra.`
      return f.ptoValue > 0
        ? `${f.ptoDays} days, worth ${usd(f.ptoValue)} a year above the ${MARKET_PTO_DAYS}-day norm.`
        : `${f.ptoDays} days, at or under the ${MARKET_PTO_DAYS}-day norm, so $0 extra.`
    case 'housing':
      if (f.rentMonthly <= 0) return 'Not entered yet. Pick a city above and it fills in the market rate.'
      return f.rentPct !== null
        ? `${usd(f.rentMonthly)} a month, ${f.rentPct}% of your take-home.`
        : `${usd(f.rentMonthly)} a month.`
    default:
      return null
  }
}

function FigureLine({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <p className="mb-1.5 text-[13.5px] font-bold leading-snug text-[#386641]">
      Your offer: <span className="font-semibold text-gray-900">{text}</span>
    </p>
  )
}

export function OfferNumberChips() {
  const [open, setOpen] = useState<string | null>(null)
  const seen = useRef(new Set<string>())
  const current = NUMBERS.find((n) => n.id === open)
  const figures = useOfferFigures()

  const report = (id: string, how: 'tap' | 'hover') => {
    if (seen.current.has(id)) return
    seen.current.add(id)
    track('tool_row_explained', { tool: 'offer', row: id, surface: 'number_chips', how, has_figure: !!figures })
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        {NUMBERS.map((item, i) => {
          const active = open === item.id
          return (
            <div key={item.id} className="group relative" onMouseEnter={() => report(item.id, 'hover')}>
              <button
                type="button"
                aria-expanded={active}
                aria-controls="offer-number-explain"
                aria-describedby={`offer-number-hover-${item.id}`}
                onClick={() => {
                  setOpen(active ? null : item.id)
                  if (!active) report(item.id, 'tap')
                }}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition',
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
              {/* Desktop only: a card on hover or keyboard focus. Phones have
                  no hover; they get the same content from a tap, below. */}
              <div
                id={`offer-number-hover-${item.id}`}
                role="tooltip"
                className={cn(
                  'pointer-events-none absolute top-full z-30 mt-2 hidden w-[300px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-[13px] leading-relaxed text-gray-600 shadow-lg md:group-hover:block md:group-focus-within:block',
                  i % 4 >= 2 ? 'right-0' : 'left-0',
                )}
              >
                <FigureLine text={yourFigure(item.id, figures)} />
                {item.explain}
              </div>
            </div>
          )
        })}
      </div>
      {current ? (
        <div id="offer-number-explain" className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[14px] leading-relaxed text-gray-700">
          <FigureLine text={yourFigure(current.id, figures)} />
          <strong className="font-bold text-gray-900">{current.label}.</strong> {current.explain}{' '}
          <a href="#method" className="whitespace-nowrap font-semibold text-[#386641] underline underline-offset-2">
            How it&apos;s worked out ↓
          </a>
        </div>
      ) : (
        <p className="mt-2 text-center text-[12.5px] text-gray-400">
          {figures ? 'Hover or tap any of them to see your number and how it’s counted.' : 'Hover or tap any of them to see how it’s counted.'}
        </p>
      )}
    </div>
  )
}
