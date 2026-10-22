'use client'

import { useEffect, useState } from 'react'
import { track } from '@/lib/analytics'

/**
 * The approved wording for each calculator (counsel). Tapping the button is the consent: there is no
 * checkbox. The server refuses any consent version not listed for the tool.
 */
export const TEXT_PILOT_COPY = {
  rent: {
    consentVersion: 'variant-a-v3',
    headline: 'Ask Ribbit anything about your rent or money. Answers come by text.',
    consent:
      'By tapping the button, you agree to get texts from Ribbit from WeLeap with your breakdown, answers to your rent and money questions, and Friday check-ins if you turn them on. Up to 4 texts a month. Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
  },
  offer: {
    consentVersion: 'offer-a-v1',
    headline: 'Ask Ribbit anything about your offer, rent or money. Answers come by text.',
    consent:
      'By tapping the button, you agree to get texts from Ribbit from WeLeap with your breakdown and answers to your offer, rent and money questions. Up to 4 texts a month. Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.',
  },
} as const

/** The line under the headline, the same for both calculators. */
export const TEXT_PILOT_SUBLINE = 'General answers from your numbers, not personal financial advice.'

/** US numbers only for the pilot. Returns E.164 or null. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

const SENT = 'Check your messages. Ribbit from WeLeap is texting you now.'
const NOT_SENT = "We couldn't send that just now. Try again later."
const NO_PHONE = 'Enter a US phone number.'

/**
 * The text opt-in shared by the rent and offer calculators. The tool supplies its own figures and the
 * route that takes them, and the copy for its own tool; the form is the same for both.
 */
export function RentTextOptIn({
  planData,
  endpoint = '/api/rent-text',
  tool = 'rent',
}: {
  planData: object
  endpoint?: string
  tool?: 'rent' | 'offer'
}) {
  const copy = TEXT_PILOT_COPY[tool]
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const e164 = toE164(phone)
    if (!e164) {
      setStatus('error')
      setMessage(NO_PHONE)
      return
    }
    setStatus('sending')
    setMessage('')
    track('tool_door_tap', { tool, door: 'text' })
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: e164,
          consent: true,
          consentVersion: copy.consentVersion,
          planData,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { sent?: boolean }
      if (res.ok && body.sent) {
        setStatus('sent')
        setMessage(SENT)
      } else {
        setStatus('error')
        setMessage(NOT_SENT)
      }
    } catch {
      setStatus('error')
      setMessage(NOT_SENT)
    }
  }

  return (
    <form
      id="text-breakdown"
      onSubmit={submit}
      className="scroll-mt-24 rounded-xl border-2 border-emerald-800/25 bg-emerald-50/70 p-5 space-y-4"
    >
      <div>
        <p className="text-lg font-bold text-stone-900">{copy.headline}</p>
        <p className="text-sm text-stone-600">{TEXT_PILOT_SUBLINE}</p>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Mobile number</span>
        <input
          id="text-breakdown-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-0101"
          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-base"
        />
      </label>
      <p className="text-xs text-stone-600">{copy.consent}</p>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-md bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {status === 'sending' ? 'Sending…' : 'Text me the breakdown'}
      </button>
      {message && (
        <p role="status" className={status === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-700'}>
          {message}
        </p>
      )}
    </form>
  )
}

/**
 * Phone-only. Once the results are shown, a bottom bar keeps the text door in reach until the
 * form itself is on screen. Most phone users never scroll to the bottom of the page.
 */
export function RentTextStickyBar({ tool = 'rent' }: { tool?: 'rent' | 'offer' }) {
  const [formVisible, setFormVisible] = useState(true)

  useEffect(() => {
    const form = document.getElementById('text-breakdown')
    if (!form || typeof IntersectionObserver === 'undefined') {
      setFormVisible(false)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.3 })
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  if (formVisible) return null

  const goToForm = () => {
    track('tool_door_tap', { tool, door: 'text_sticky' })
    document.getElementById('text-breakdown')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById('text-breakdown-phone')?.focus({ preventScroll: true })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur md:hidden">
      <button
        type="button"
        onClick={goToForm}
        className="w-full rounded-md bg-emerald-800 px-4 py-3 font-semibold text-white"
      >
        Text me the breakdown
      </button>
    </div>
  )
}
