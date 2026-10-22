'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import {
  TEXT_PILOT_COPY,
  TEXT_PILOT_SUBLINE,
  phonePlatform,
  smsBody,
  smsHref,
  toE164,
  type TextPilotTool,
} from '@/lib/text-pilot'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const SENT = 'Check your messages. Ribbit from WeLeap is texting you now.'
const NOT_SENT = "We couldn't send that just now. Try again later."
const NO_PHONE = 'Enter a US phone number.'
const SEND_IT = 'Send the text in Messages and Ribbit will reply with your breakdown.'

/** Phones get the pre-written text; everything else, or a phone whose code could not be fetched, the form. */
type Door = 'ios' | 'android' | 'form'

/**
 * The text opt-in shared by the rent and offer calculators. The tool supplies its own figures and the
 * route that takes them, and the copy for its own tool; the door is the same for both. On a phone the button
 * opens Messages with the text already written and a code that finds the result; sending it is the consent.
 * Elsewhere it is the number form, and Ribbit texts first.
 */
export function TextOptIn({
  planData,
  endpoint = '/api/rent-text',
  tool = 'rent',
}: {
  planData: object
  endpoint?: string
  tool?: TextPilotTool
}) {
  const copy = TEXT_PILOT_COPY[tool]
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  // Null until the page has read the user agent; the server cannot know.
  const [door, setDoor] = useState<Door | null>(null)
  const [link, setLink] = useState<{ href: string; id: string } | null>(null)
  const shown = useRef(false)
  const onPhone = door === 'ios' || door === 'android'
  const method = onPhone ? 'sms_link' : 'phone_form'

  useEffect(() => {
    setDoor(phonePlatform(navigator.userAgent, navigator.maxTouchPoints) ?? 'form')
  }, [])

  // Once per page, so submitted ÷ shown is the door's conversion rate.
  useEffect(() => {
    if (!door || shown.current) return
    shown.current = true
    track('text_optin_shown', { tool, method })
  }, [door, tool, method])

  // On a phone, save the result and get its code now, so the button is a plain link when it is tapped. The
  // figures settle a moment after the result first shows (late-loading rent data), so wait for them: each
  // fetch saves a result.
  const planKey = JSON.stringify(planData)
  useEffect(() => {
    if (door !== 'ios' && door !== 'android') return
    let live = true
    setLink(null)
    const timer = setTimeout(() => {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: `{"method":"ref","planData":${planKey}}`,
      })
        .then((res) => (res.ok ? (res.json() as Promise<{ ref: string; to: string; id: string }>) : Promise.reject()))
        .then((d) => {
          if (live) setLink({ href: smsHref(d.to, smsBody(tool, d.ref), door), id: d.id })
        })
        .catch(() => {
          if (!live) return
          track('text_optin_failed', { tool, method: 'sms_link', reason: 'no_ref' })
          setDoor('form')
        })
    }, 800)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [door, planKey, endpoint, tool])

  // The tap opens Messages by itself; this only records it, for the match when the code is deleted.
  const tap = () => {
    if (!link) return
    track('text_optin_submitted', { tool, consent_version: copy.sms.consentVersion, placement: 'form', method })
    const body = JSON.stringify({ method: 'tap', id: link.id })
    const beaconed = navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'application/json' }))
    if (!beaconed) {
      fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
    setMessage(SEND_IT)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const e164 = toE164(phone)
    if (!e164) {
      track('text_optin_failed', { tool, method, reason: 'invalid_phone' })
      setStatus('error')
      setMessage(NO_PHONE)
      return
    }
    setStatus('sending')
    setMessage('')
    track('text_optin_submitted', { tool, consent_version: copy.consentVersion, placement: 'form', method })
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
      const body = (await res.json().catch(() => ({}))) as { sent?: boolean; reason?: string }
      if (res.ok && body.sent) {
        track('text_optin_sent', { tool, consent_version: copy.consentVersion, method })
        setStatus('sent')
        setMessage(SENT)
      } else {
        track('text_optin_failed', {
          tool,
          method,
          reason: res.status === 202 ? 'not_sent' : 'error',
          ...(body.reason ? { backend_reason: body.reason } : {}),
        })
        setStatus('error')
        setMessage(NOT_SENT)
      }
    } catch {
      track('text_optin_failed', { tool, method, reason: 'error' })
      setStatus('error')
      setMessage(NOT_SENT)
    }
  }

  const heading = (
    <div>
      <p className="text-lg font-bold text-stone-900">{copy.headline}</p>
      <p className="text-sm text-stone-600">{TEXT_PILOT_SUBLINE}</p>
    </div>
  )
  const card = 'scroll-mt-24 rounded-xl border-2 border-emerald-800/25 bg-emerald-50/70 p-5 space-y-4'
  const buttonClass = 'block w-full rounded-md bg-emerald-800 px-4 py-3 text-center font-semibold text-white sm:w-auto sm:inline-block'

  if (door === null) {
    return (
      <div id="text-breakdown" className={card}>
        {heading}
      </div>
    )
  }

  if (onPhone) {
    return (
      <div id="text-breakdown" className={card}>
        {heading}
        <p className="text-xs text-stone-600">{copy.sms.consent}</p>
        {link ? (
          <a href={link.href} onClick={tap} className={buttonClass}>
            {copy.sms.button}
          </a>
        ) : (
          <button type="button" disabled className={`${buttonClass} opacity-60`}>
            {copy.sms.button}
          </button>
        )}
        {message && (
          <p role="status" className="text-sm text-stone-700">
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      id="text-breakdown"
      onSubmit={submit}
      className={card}
    >
      {heading}
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
export function TextOptInStickyBar({ tool = 'rent' }: { tool?: TextPilotTool }) {
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
    track('text_optin_sticky_clicked', { tool })
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
