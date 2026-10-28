'use client'

/**
 * Upload an internship offer letter and fill the form from it.
 *
 * From the Purdue career-center tester: "Would you be able to include the
 * 'upload offer letter' feature for this one as well? … it finds the start and
 * end dates and calculates the number of weeks for the user and picks up any
 * important info the user might've missed."
 *
 * One button rather than the full-time tool's two. That tool asks for a
 * benefits guide as well because offer letters rarely state the match; an
 * internship letter either states its terms or the intern does not have a
 * guide. Everything else — the size cap, the timeout, the messages, the
 * stalled-picker detection for in-app browsers — is the full-time uploader's,
 * imported rather than restated, so the two cannot drift.
 *
 * The server reads the dates; this component never does arithmetic on them.
 * See lib/offer-parse/internship.ts.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ACCEPT,
  MAX_BYTES,
  MESSAGES,
  PICKER_GRACE_MS,
  REQUEST_TIMEOUT_MS,
  waitPhrase,
  withFormDirection,
} from '@/components/OfferLetterUpload'
import { track } from '@/lib/analytics'
import { stampFirstDocClass } from '@/lib/offer-parse/doc-analytics'
import type { ParsedInternship } from '@/lib/offer-parse/internship'

const DOC_CLASS = 'internship_offer' as const

export function InternshipLetterUpload({ onParsed }: { onParsed: (parsed: ParsedInternship) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filled, setFilled] = useState<number | null>(null)
  const [pickerStalled, setPickerStalled] = useState(false)
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (stallTimer.current) clearTimeout(stallTimer.current)
  }, [])

  // Same tell as the full-time uploader: a picker that opened took focus.
  const watchForPicker = useCallback(() => {
    setPickerStalled(false)
    if (stallTimer.current) clearTimeout(stallTimer.current)
    let left = false
    const noteLeft = () => { left = true }
    window.addEventListener('blur', noteLeft, { once: true })
    document.addEventListener('visibilitychange', noteLeft, { once: true })
    stallTimer.current = setTimeout(() => {
      window.removeEventListener('blur', noteLeft)
      document.removeEventListener('visibilitychange', noteLeft)
      if (left) return
      setPickerStalled(true)
      track('doc_picker_no_response', { doc_class: DOC_CLASS })
    }, PICKER_GRACE_MS)
  }, [])

  async function handleFile(file: File) {
    if (stallTimer.current) clearTimeout(stallTimer.current)
    setPickerStalled(false)
    setError(null)
    setFilled(null)

    if (file.size > MAX_BYTES) {
      setError(withFormDirection(MESSAGES.too_large!, false))
      track('doc_parse_failed', { doc_class: DOC_CLASS, failure_reason: 'too_large' })
      return
    }

    setBusy(true)
    track('doc_uploaded', { doc_class: DOC_CLASS, file_type: file.type || 'unknown' })
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', 'internship')
      const response = await fetch('/api/parse-offer', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const header = response.headers.get('Retry-After')
        const message = (MESSAGES[data?.error as string] ?? MESSAGES.default!).replace(
          '{wait}',
          waitPhrase(header === null ? null : Number(header)),
        )
        setError(withFormDirection(message, false))
        track('doc_parse_failed', { doc_class: DOC_CLASS, failure_reason: String(data?.error ?? response.status) })
        return
      }

      const parsed = (data.parsed ?? {}) as ParsedInternship
      // Perks alone are not a filled form; count only the fields that set an input.
      const count = Object.keys(parsed).filter((k) => k !== 'otherPerks').length
      if (count === 0) {
        setError(withFormDirection(MESSAGES.no_fields!, false))
        track('doc_parse_failed', { doc_class: DOC_CLASS, failure_reason: 'no_fields' })
        return
      }

      onParsed(parsed)
      setFilled(count)
      stampFirstDocClass(DOC_CLASS)
      track('doc_parsed', {
        doc_class: DOC_CLASS,
        fields_extracted: count,
        perks_found: parsed.otherPerks?.length ?? 0,
        extraction_path: data.path,
        redactions: data.redactions ?? 0,
        rejected_count: data.rejectedCount ?? 0,
        latency_ms: data.latencyMs ?? null,
      })
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
      setError(withFormDirection((timedOut ? MESSAGES.timeout : MESSAGES.default)!, false))
      track('doc_parse_failed', { doc_class: DOC_CLASS, failure_reason: timedOut ? 'client_timeout' : 'network' })
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className="mb-5 rounded-2xl border-2 border-dashed border-[#386641]/35 bg-[#386641]/[0.04] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-bold text-[#111827]">Have the offer letter?</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">
            Upload it and we&apos;ll fill in the pay, the term from its dates, and the housing — and tell you about
            anything in it these numbers don&apos;t price.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            track('doc_upload_started', { doc_class: DOC_CLASS, surface: 'tool', authed: false })
            watchForPicker()
            ref.current?.click()
          }}
          className="w-full shrink-0 rounded-xl border-2 border-[#386641] bg-white px-5 py-2.5 text-sm font-bold text-[#386641] transition hover:bg-[#386641] hover:text-white disabled:opacity-60 sm:w-auto"
        >
          {busy ? 'Reading…' : 'Upload offer letter'}
        </button>
        <input
          ref={ref}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      {error && (
        <p
          className="mt-3 rounded-lg border border-[#E4C9A8] bg-[#FDF6EC] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#7A4F1C]"
          role="alert"
        >
          {error}
        </p>
      )}

      {pickerStalled && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
          <span className="font-bold">Nothing happened?</span> Some apps block file uploads from inside them. The
          form below works the same — nothing here is required.
        </p>
      )}

      {filled !== null && (
        <p className="mt-3 text-[13px] font-semibold text-[#386641]" role="status">
          Filled in {filled} {filled === 1 ? 'field' : 'fields'} from your offer letter. Every one is still editable.
        </p>
      )}

      <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
        Optional — the form below works without it. PDF, PNG or JPG. We read the numbers and never store the file,
        and we do not read or keep names, addresses or ID numbers.
      </p>
    </div>
  )
}
