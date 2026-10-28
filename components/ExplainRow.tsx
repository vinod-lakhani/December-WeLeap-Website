'use client'

/**
 * A result row whose label opens a one-paragraph explanation of the number.
 *
 * From the Purdue career-center tester, 27 Oct 2026: "it would be nice if each
 * of these numbers had a link where if I clicked on the Equity box, it would
 * scroll down and tell me more about how equity is factored in. Or if you
 * hover the mouse over each one…"
 *
 * A tap, not a hover. Most traffic is phones, where hover does not exist, and
 * a tooltip that only a mouse can open is a tooltip most visitors never see.
 * The explanation opens in place under the row, so nobody loses their place on
 * a long page, and ends with a link down to the full method for anyone who
 * wants the whole derivation — the scroll Ava asked for, offered rather than
 * forced.
 *
 * `tool_row_explained` fires the first time a given row is opened, so the rows
 * people do not understand show up in the data rather than in an email.
 */

import { useId, useRef, useState } from 'react'

import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export interface ExplainRowProps {
  /** Analytics slug of the tool. */
  tool: string
  /** Stable id for the row, sent with `tool_row_explained`. */
  row: string
  label: React.ReactNode
  value: React.ReactNode
  /** One short paragraph: what the number is and how it is worked out. */
  explain: React.ReactNode
  /** A line under the label, as some rows already carry. */
  note?: React.ReactNode
  tone?: 'light' | 'dark'
  className?: string
  labelClassName?: string
}

export function ExplainRow({
  tool, row, label, value, explain, note, tone = 'light', className, labelClassName,
}: ExplainRowProps) {
  const [open, setOpen] = useState(false)
  const reported = useRef(false)
  const panelId = useId()
  const dark = tone === 'dark'

  const toggle = () => {
    setOpen((v) => !v)
    if (!reported.current) {
      reported.current = true
      track('tool_row_explained', { tool, row })
    }
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className={cn(
              'group -my-1 inline-flex min-h-8 items-center gap-1.5 text-left',
              labelClassName,
            )}
          >
            <span className="underline decoration-dotted underline-offset-[3px] decoration-current/40 group-hover:decoration-current">
              {label}
            </span>
            <span
              aria-hidden
              className={cn(
                'inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold leading-none',
                dark ? 'border-white/30 text-white/50' : 'border-gray-300 text-gray-400',
              )}
            >
              {open ? '−' : 'i'}
            </span>
          </button>
          {note && <div className="mt-0.5">{note}</div>}
        </div>
        <div className="shrink-0">{value}</div>
      </div>
      {open && (
        <div
          id={panelId}
          className={cn(
            'mt-2 rounded-lg px-3 py-2.5 text-[12.5px] leading-relaxed',
            dark ? 'bg-white/[0.06] text-white/70' : 'bg-gray-50 text-gray-600',
          )}
        >
          {explain}{' '}
          <a
            href="#method"
            className={cn('whitespace-nowrap font-semibold underline underline-offset-2', dark ? 'text-[#A7C957]' : 'text-[#386641]')}
          >
            How it&apos;s worked out ↓
          </a>
        </div>
      )}
    </div>
  )
}
