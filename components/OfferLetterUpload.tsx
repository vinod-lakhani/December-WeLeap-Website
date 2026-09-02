'use client'

/**
 * The upload control that sits above the offer form.
 *
 * It fills the form in. It does not replace it, gate it, or take the user
 * somewhere else — every value it produces lands in an input that was already
 * there and stays editable. If this component fails in any way, including
 * silently, the page behaves exactly as it did before it existed.
 *
 * That is deliberate and it is the reason there is no confirmation screen: the
 * form is the confirmation screen. It is also why every error path below ends
 * in the same place — a short line of text and a form the user can type into —
 * rather than a retry loop or a modal.
 */

import { useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import type { ParsedOffer } from '@/lib/offer-parse/fields'

/** Kept just under the 4 MB the route accepts, so the check fails here first. */
const MAX_BYTES = 4 * 1024 * 1024

const ACCEPT = 'application/pdf,image/png,image/jpeg'

/**
 * One message per failure, written for someone holding a document rather than
 * reading a status code. None of them suggest retrying the same file: if a
 * scan is unreadable it will be unreadable twice, and the form is right there.
 */
const MESSAGES: Record<string, string> = {
  too_large: 'That file is over 4MB. A PDF export is usually much smaller than a photo.',
  unsupported_type: 'We can read PDF, PNG and JPG files.',
  empty_file: 'That file looks empty.',
  no_fields:
    'We could not find the numbers in that one. It may be a scan we cannot read, or not an offer letter — the form below still works.',
  upload_unavailable: 'Upload is unavailable right now. The form below still works.',
  busy: 'We are busy right now. Try again in a moment, or use the form below.',
  default: 'Something went wrong reading that. The form below still works.',
}

export interface OfferLetterUploadProps {
  /** Called with whatever survived validation. Never called with nothing. */
  onParsed: (parsed: ParsedOffer) => void
}

export function OfferLetterUpload({ onParsed }: OfferLetterUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filled, setFilled] = useState<number | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setFilled(null)

    if (file.size > MAX_BYTES) {
      setError(MESSAGES.too_large!)
      track('doc_parse_failed', { doc_class: 'offer_letter', failure_reason: 'too_large' })
      return
    }

    setBusy(true)
    track('doc_uploaded', { doc_class: 'offer_letter', file_type: file.type || 'unknown' })

    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/parse-offer', { method: 'POST', body })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(MESSAGES[data?.error as string] ?? MESSAGES.default!)
        track('doc_parse_failed', {
          doc_class: 'offer_letter',
          failure_reason: String(data?.error ?? response.status),
        })
        return
      }

      const count = Object.keys(data.parsed ?? {}).length
      // A parse that finds nothing is a failure from where the user is
      // standing, whatever the status code said.
      if (count === 0) {
        setError(MESSAGES.no_fields!)
        track('doc_parse_failed', { doc_class: 'offer_letter', failure_reason: 'no_fields' })
        return
      }

      onParsed(data.parsed as ParsedOffer)
      setFilled(count)
      track('doc_parsed', {
        doc_class: 'offer_letter',
        fields_extracted: count,
        // Which route the document took. `text` means unpdf read it and the
        // redaction sweep ran before the model saw anything; `vision` means it
        // was a scan or a photo and it did not.
        extraction_path: data.path,
        redactions: data.redactions ?? 0,
        rejected_count: data.rejectedCount ?? 0,
        latency_ms: data.latencyMs ?? null,
      })
    } catch {
      setError(MESSAGES.default!)
      track('doc_parse_failed', { doc_class: 'offer_letter', failure_reason: 'network' })
    } finally {
      setBusy(false)
      // Let the same file be picked again after an error.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mb-4 rounded-2xl border-2 border-dashed border-[#386641]/35 bg-[#386641]/[0.04] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-bold text-[#111827]">Have the offer letter handy?</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">
            Upload it and we&apos;ll fill in what it says — including the match formula and PTO,
            which are guesses until you do.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            track('doc_upload_started', { doc_class: 'offer_letter', surface: 'tool', authed: false })
            inputRef.current?.click()
          }}
          className="shrink-0 rounded-xl border-2 border-[#386641] bg-white px-5 py-2.5 text-sm font-bold text-[#386641] transition hover:bg-[#386641] hover:text-white disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-[#386641]"
        >
          {busy ? 'Reading…' : 'Upload offer letter'}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      {filled !== null && (
        /* Counts what was found. What was NOT found is asked for by the callout
           the tool renders directly beneath this, where it can name the missing
           terms — this line would only be guessing at them. */
        <p className="mt-3 text-[13px] font-semibold text-[#386641]" role="status">
          Filled in {filled} {filled === 1 ? 'field' : 'fields'} from your letter. Every one is
          still editable.
        </p>
      )}

      {error && (
        <p className="mt-3 text-[13px] text-gray-600" role="status">
          {error}
        </p>
      )}

      {/* The commitment, stated where the decision is made rather than in a
          policy page. It is also literally true: see app/api/parse-offer. */}
      <p className="mt-3 text-[12px] leading-relaxed text-gray-500">
        PDF, PNG or JPG. We read the numbers and never store the file. We do not read or keep
        names, addresses or ID numbers.
      </p>
    </div>
  )
}
