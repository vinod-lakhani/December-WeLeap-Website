'use client'

import { useEffect, useState } from 'react'
import { track } from '@/lib/analytics'
import type { PlanData } from './WaitlistForm'

/** The approved wording (counsel, Variant A). The server refuses any other version. */
export const RENT_TEXT_CONSENT_VERSION = 'variant-a-v1'
export const RENT_TEXT_CONSENT_COPY =
  'Text me this breakdown and follow-ups from Ribbit from WeLeap about this rent result, up to 4 texts a month, including Friday check-ins until move-in. Msg & data rates may apply. Reply STOP to end, HELP for help. Not a condition of using this tool.'

/** US numbers only for the pilot. Returns E.164 or null. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

type Status = 'idle' | 'sending' | 'sent' | 'not_sent' | 'error'

export function RentTextOptIn({ planData }: { planData: PlanData }) {
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const e164 = toE164(phone)
    if (!e164) {
      setStatus('error')
      setMessage('Enter a US phone number.')
      return
    }
    if (!consent) {
      setStatus('error')
      setMessage('Tick the box to get the breakdown by text.')
      return
    }
    setStatus('sending')
    setMessage('')
    track('tool_door_tap', { tool: 'rent', door: 'text' })
    try {
      const res = await fetch('/api/rent-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: e164,
          consent: true,
          consentVersion: RENT_TEXT_CONSENT_VERSION,
          planData,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { sent?: boolean; reason?: string; error?: string }
      if (res.ok && body.sent) {
        setStatus('sent')
        setMessage('Ribbit will text you shortly.')
      } else if (res.status === 202) {
        setStatus('not_sent')
        setMessage(`Not sent yet (${body.reason ?? 'not enabled'}).`)
      } else {
        setStatus('error')
        setMessage(body.error ?? 'We could not send that. Try again later.')
      }
    } catch {
      setStatus('error')
      setMessage('We could not send that. Try again later.')
    }
  }

  return (
    <form
      id="text-breakdown"
      onSubmit={submit}
      className="scroll-mt-24 rounded-xl border-2 border-emerald-800/25 bg-emerald-50/70 p-5 space-y-4"
    >
      <div>
        <p className="text-lg font-bold text-stone-900">Get this breakdown by text</p>
        <p className="text-sm text-stone-600">We text the number from this result, then follow up only if you reply.</p>
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
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span className="text-xs text-stone-600">{RENT_TEXT_CONSENT_COPY}</span>
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-md bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {status === 'sending' ? 'Sending…' : 'Text me this breakdown'}
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
export function RentTextStickyBar() {
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
    track('tool_door_tap', { tool: 'rent', door: 'text_sticky' })
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
        Text me this breakdown
      </button>
    </div>
  )
}
