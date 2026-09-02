'use client'

/**
 * Reads a paystub into the money plan's opening questions.
 *
 * The plan starts by asking for salary, state, current 401(k) percentage and
 * whether the employer matches. Three of those four are on every paystub, and
 * the fourth — the deferral percentage — is the one nobody can answer from
 * memory. `wCurrent401k` defaults to "0", so without this the plan opens by
 * assuming the user contributes nothing and builds its first Leap on that.
 *
 * Optional, like the offer-letter upload: everything below still works if this
 * fails, is switched off, or is ignored.
 */

import { useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import { stampFirstDocClass } from '@/lib/offer-parse/doc-analytics'
import {
  PAY_FREQUENCIES,
  deferralState,
  employerMatchState,
  type ParsedPaystub,
} from '@/lib/offer-parse/fields'

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

const MESSAGES: Record<string, string> = {
  too_large: 'That file is over 4MB. A PDF from your payroll site is usually much smaller than a photo.',
  unsupported_type: 'We can read PDF, PNG and JPG files.',
  empty_file: 'That file looks empty.',
  no_fields: 'We could not read that one. It may be a scan we cannot make out — the questions below still work.',
  upload_unavailable: 'Upload is unavailable right now. The questions below still work.',
  rate_limited: 'You have uploaded a few documents in a short time. Give it an hour, or answer below.',
  timeout:
    'That one took too long to read — it may be a large or complex file. The questions below still work.',
  default: 'Something went wrong reading that. The questions below still work.',
}

export interface PaystubResult {
  /** Gross for the period, annualised by the stub's own stated frequency. */
  annualSalary: number | null
  stateCode: string | null
  /** Employee deferral as a percent of gross, computed here from two figures. */
  currentDeferralPct: number | null
  /**
   * The employee has already hit the annual 401(k) limit.
   *
   * Changes the advice rather than decorating it: the plan's first move is
   * capturing the match, and there is nothing left to capture.
   */
  maxedOut: boolean
  /** True when a match appears in either column. Never false — see fields.ts. */
  hasMatch: true | null
}

export function PaystubUpload({ onRead }: { onRead: (result: PaystubResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setSummary(null)

    if (file.size > MAX_BYTES) {
      setError(MESSAGES.too_large!)
      track('doc_parse_failed', { doc_class: 'paystub', failure_reason: 'too_large' })
      return
    }

    setBusy(true)
    track('doc_uploaded', { doc_class: 'paystub', file_type: file.type || 'unknown' })

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', 'paystub')
      const response = await fetch('/api/parse-offer', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(MESSAGES[data?.error as string] ?? MESSAGES.default!)
        track('doc_parse_failed', { doc_class: 'paystub', failure_reason: String(data?.error ?? response.status) })
        return
      }

      const parsed = (data.parsed ?? { lines: [] }) as ParsedPaystub
      const gross = parsed.grossPayCurrent
      const periods = parsed.payFrequency ? PAY_FREQUENCIES[parsed.payFrequency] : null

      /**
       * Annualising happens here, from two figures both printed on the stub.
       * Asking the model for an annual salary would have made it multiply, and
       * hidden which frequency it assumed inside a number nobody can check.
       */
      const annualSalary = gross && periods ? Math.round(gross * periods) : null
      const match = employerMatchState(parsed.lines ?? [])
      const deferral = deferralState(parsed.lines ?? [], gross, parsed.grossPayYtd)

      const result: PaystubResult = {
        annualSalary,
        stateCode: parsed.workStateCode ?? null,
        currentDeferralPct:
          deferral.kind === 'contributing'
            ? deferral.pct
            : deferral.kind === 'maxed'
              ? deferral.effectivePct
              : null,
        maxedOut: deferral.kind === 'maxed',
        hasMatch: match.hasMatch === true ? true : null,
      }

      if (!result.annualSalary && result.currentDeferralPct === null && !result.maxedOut) {
        setError(MESSAGES.no_fields!)
        track('doc_parse_failed', { doc_class: 'paystub', failure_reason: 'no_fields' })
        return
      }

      onRead(result)

      // Says what was found AND what was not, because the gap matters here: a
      // stub with no match line leaves the match question genuinely open, and
      // the user has to answer it themselves rather than assume we knew.
      const found: string[] = []
      if (result.annualSalary) found.push('your salary')
      if (result.currentDeferralPct !== null) found.push(`your ${result.currentDeferralPct}% contribution`)
      if (result.stateCode) found.push('your state')
      const read = found.length ? `Read ${found.join(', ')}.` : 'Read your stub.'
      const matchNote = result.hasMatch
        ? " Your employer's match is on there too."
        : ' Your stub does not show an employer match — many payroll systems never print one, so that question is still yours to answer.'
      setSummary(
        // The cap goes first when it applies, because it changes what the plan
        // should say rather than adding to it.
        result.maxedOut
          ? `You have already hit this year's 401(k) limit — the year-to-date figure on your stub is at the cap, which is why the current period shows nothing going in. ${read}${matchNote}`
          : `${read}${matchNote}`
      )

      // First document wins, and it stays on the person — see doc-analytics.
      stampFirstDocClass('paystub')
      track('doc_parsed', {
        doc_class: 'paystub',
        extraction_path: data.path,
        redactions: data.redactions ?? 0,
        rejected_count: data.rejectedCount ?? 0,
        line_count: (parsed.lines ?? []).length,
        found_deferral: result.currentDeferralPct !== null,
        found_match: result.hasMatch === true,
        maxed_out: result.maxedOut,
        latency_ms: data.latencyMs ?? null,
      })
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
      setError((timedOut ? MESSAGES.timeout : MESSAGES.default)!)
      track('doc_parse_failed', { doc_class: 'paystub', failure_reason: timedOut ? 'client_timeout' : 'network' })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mb-4 rounded-xl border-2 border-dashed border-[#386641]/35 bg-[#386641]/[0.04] px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-bold text-[#111827]">Have a recent paystub?</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">
            It shows what you already contribute, which is the one number here most people cannot
            recall.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            track('doc_upload_started', { doc_class: 'paystub', surface: 'tool', authed: false })
            inputRef.current?.click()
          }}
          className="w-full shrink-0 rounded-xl border-2 border-[#386641] bg-white px-5 py-2.5 text-sm font-bold text-[#386641] transition hover:bg-[#386641] hover:text-white disabled:opacity-60 sm:w-auto"
        >
          {busy ? 'Reading…' : 'Upload paystub'}
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

      <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-700">
          No paystub to hand? Just answer the questions below — it works the same either way.
        </span>
      </p>

      {summary && (
        <p className="mt-3 text-[13px] leading-relaxed text-[#386641]" role="status">
          {summary}
        </p>
      )}
      {error && (
        <p className="mt-3 text-[13px] text-gray-600" role="status">
          {error}
        </p>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-gray-500">
        PDF, PNG or JPG. We read the numbers and never store the file. We do not read or keep your
        name, address, Social Security number or any account number.
      </p>
    </div>
  )
}
