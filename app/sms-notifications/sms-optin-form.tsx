'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONSENT_TEXT = "I agree to receive recurring automated SMS notifications from WeLeap about my weekly financial summary, recommended actions (Leaps), and reminders. Msg frequency varies (about 1 to 3 per week). Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of using WeLeap."

export function SmsOptinForm() {
  const [phone, setPhone] = useState('')
  const [checked, setChecked] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const digits = phone.replace(/\D/g, '')
  const isValid = digits.length >= 10 && checked

  function handleSubmit() {
    if (!isValid) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-green-50 px-6 py-8 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-[#386641] text-white flex items-center justify-center text-xl mx-auto mb-4">✓</div>
        <h3 className="text-lg font-bold text-[#1A3320] mb-2">You're in.</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your consent has been recorded. Once WeLeap text notifications are live, you'll start receiving your weekly messages. Reply <strong>STOP</strong> anytime to unsubscribe.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 max-w-md">
      {/* Phone input */}
      <label className="block text-sm font-semibold text-[#1A3320] mb-1.5">Mobile number</label>
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="(555) 000-0000"
        autoComplete="tel"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-[#EDF4EE] focus:outline-none focus:border-[#386641] mb-5"
      />

      {/* Consent checkbox */}
      <div className="flex gap-3 items-start mb-5">
        <input
          type="checkbox"
          id="sms-consent"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          className="w-5 h-5 min-w-[20px] mt-0.5 accent-[#386641] cursor-pointer"
        />
        <label htmlFor="sms-consent" className="text-xs leading-relaxed text-gray-700 cursor-pointer">
          {CONSENT_TEXT}{' '}See{' '}
          <Link href="/terms-of-service" className="text-[#386641] underline">Terms</Link> and{' '}
          <Link href="/privacy-policy" className="text-[#386641] underline">Privacy Policy</Link>.
        </label>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full bg-[#386641] text-white font-semibold text-base py-3 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d5235]"
      >
        Sign up for texts
      </button>
    </div>
  )
}
