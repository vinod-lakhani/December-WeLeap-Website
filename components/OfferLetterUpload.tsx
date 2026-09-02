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
import { cn } from '@/lib/utils'
import type { ParsedOffer } from '@/lib/offer-parse/fields'

/** Kept just under the 4 MB the route accepts, so the check fails here first. */
const MAX_BYTES = 4 * 1024 * 1024

/**
 * A backstop above the server's own deadline, not a duplicate of it.
 *
 * The route fails itself at 25s and Vercel ends the request at 60, so in normal
 * operation an answer always arrives. This exists for the case where neither
 * happens — a connection that stalls rather than closes — because without it
 * `fetch` waits forever and the button reads "Reading…" until the tab is shut.
 */
const REQUEST_TIMEOUT_MS = 70_000

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
  // Distinct from `busy`, which blames us. This one tells the reader the limit
  // is theirs and that the form still works, because it does.
  rate_limited:
    'You have uploaded a few documents in a short time. Give it an hour, or fill the form in below — it works the same.',
  timeout:
    'That one took too long to read — it may be a large or complex file. The form below still works.',
  default: 'Something went wrong reading that. The form below still works.',
}

export type DocKind = 'offer' | 'benefits'

const DOC: Record<DocKind, { button: string; analytics: string; found: string }> = {
  offer: {
    button: 'Upload offer letter',
    analytics: 'offer_letter',
    found: 'from your offer letter',
  },
  benefits: {
    button: 'Upload benefits guide',
    analytics: 'benefits_guide',
    found: 'from your benefits guide',
  },
}

export interface OfferLetterUploadProps {
  /** Called with whatever survived validation. Never called with nothing. */
  onParsed: (parsed: ParsedOffer, kind: DocKind) => void
}

export function OfferLetterUpload({ onParsed }: OfferLetterUploadProps) {
  const offerRef = useRef<HTMLInputElement>(null)
  const benefitsRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<DocKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filled, setFilled] = useState<{ count: number; kind: DocKind } | null>(null)

  /**
   * Which document this is comes from the button, not a classifier.
   *
   * The spec's pipeline detects the class from the content, and it has to —
   * it accepts one upload and works out what arrived. Here the user has
   * already said, by pressing one of two buttons, so detection would only add
   * a way to be wrong. Reading a benefits guide with the offer schema would
   * produce well-formed numbers from the wrong document, which is the one
   * failure the validation layer cannot catch.
   */
  async function handleFile(file: File, kind: DocKind) {
    setError(null)
    setFilled(null)

    if (file.size > MAX_BYTES) {
      setError(MESSAGES.too_large!)
      track('doc_parse_failed', { doc_class: DOC[kind].analytics, failure_reason: 'too_large' })
      return
    }

    setBusy(kind)
    track('doc_uploaded', { doc_class: DOC[kind].analytics, file_type: file.type || 'unknown' })

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      const response = await fetch('/api/parse-offer', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(MESSAGES[data?.error as string] ?? MESSAGES.default!)
        track('doc_parse_failed', {
          doc_class: DOC[kind].analytics,
          failure_reason: String(data?.error ?? response.status),
        })
        return
      }

      const count = Object.keys(data.parsed ?? {}).length
      // A parse that finds nothing is a failure from where the user is
      // standing, whatever the status code said.
      if (count === 0) {
        setError(MESSAGES.no_fields!)
        track('doc_parse_failed', { doc_class: DOC[kind].analytics, failure_reason: 'no_fields' })
        return
      }

      onParsed(data.parsed as ParsedOffer, kind)
      setFilled({ count, kind })
      track('doc_parsed', {
        doc_class: DOC[kind].analytics,
        fields_extracted: count,
        // Which route the document took. `text` means unpdf read it and the
        // redaction sweep ran before the model saw anything; `vision` means it
        // was a scan or a photo and it did not.
        extraction_path: data.path,
        redactions: data.redactions ?? 0,
        rejected_count: data.rejectedCount ?? 0,
        latency_ms: data.latencyMs ?? null,
      })
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
      setError((timedOut ? MESSAGES.timeout : MESSAGES.default)!)
      track('doc_parse_failed', { doc_class: DOC[kind].analytics, failure_reason: timedOut ? 'client_timeout' : 'network' })
    } finally {
      setBusy(null)
      // Let the same file be picked again after an error.
      if (offerRef.current) offerRef.current.value = ''
      if (benefitsRef.current) benefitsRef.current.value = ''
    }
  }

  const Picker = ({ kind, refObj }: { kind: DocKind; refObj: React.RefObject<HTMLInputElement> }) => (
    <>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => {
          track('doc_upload_started', { doc_class: DOC[kind].analytics, surface: 'tool', authed: false })
          refObj.current?.click()
        }}
        className={cn(
          'w-full shrink-0 rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition disabled:opacity-60 sm:w-auto',
          kind === 'offer'
            ? 'border-[#386641] bg-white text-[#386641] hover:bg-[#386641] hover:text-white disabled:hover:bg-white disabled:hover:text-[#386641]'
            : 'border-transparent bg-[#386641]/10 text-[#2d5a26] hover:bg-[#386641]/20'
        )}
      >
        {busy === kind ? 'Reading…' : DOC[kind].button}
      </button>
      <input
        ref={refObj}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file, kind)
        }}
      />
    </>
  )

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
        {/* Full width on a phone, inline once there is room. `shrink-0` on the
            wrapper meant it kept its two-buttons-wide natural size at 375px and
            the benefits button was clipped by the box it sits in. */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <Picker kind="offer" refObj={offerRef} />
          <Picker kind="benefits" refObj={benefitsRef} />
        </div>
      </div>

      {/* Says the upload is optional, in the box that makes it look mandatory.
          Two prominent buttons inside a dashed border, sitting above the form,
          read as step one of two — a visitor without the documents to hand has
          no way to tell from this that the calculator works perfectly well
          without them, and the likeliest thing they do is leave.

          Also why there are two buttons at all: across four real offer letters,
          not one stated a 401(k) match, an employer HSA contribution or a
          medical premium. Those live in the benefits guide, which is a separate
          document nobody thinks to reach for unless asked. */}
      <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-700">
          No documents to hand? Skip this and fill in the form below — it works the same either
          way.
        </span>{' '}
        Uploading just saves the typing. Most offer letters say nothing about the 401(k) match, HSA
        or health premium; the benefits guide does.
      </p>

      {filled !== null && (
        <p className="mt-3 text-[13px] font-semibold text-[#386641]" role="status">
          Filled in {filled.count} {filled.count === 1 ? 'field' : 'fields'} {DOC[filled.kind].found}
          . Every one is still editable.
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
