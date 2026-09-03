'use client'

/**
 * The campaign link builder.
 *
 * Built for people who do not work here — ambassadors, partners, Joshua — so
 * the design rule is that nothing has to be remembered. Every field is either
 * a dropdown or pre-filled, the month is appended automatically, and the two
 * links already in use are one click each.
 *
 * Values are normalised as they are used rather than as they are typed. Fixing
 * text under someone's cursor makes a field feel broken, so the cleanup is
 * shown as a note under the result instead — which also teaches the convention
 * rather than just enforcing it.
 */

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  buildLink,
  destinations,
  presets,
  monthCode,
  SOURCES,
  MEDIUMS,
  EFFORTS,
  APP_URL,
} from '@/lib/link-builder'

const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827]'

const CUSTOM = '__custom__'

/** A dropdown of known values that falls back to a text field for anything else. */
function PickOrType({
  id,
  label,
  hint,
  options,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  const known = options.includes(value)
  const [typing, setTyping] = useState(!known && value !== '')

  return (
    <div>
      <Label htmlFor={id} className="text-[#111827]">
        {label}
      </Label>
      {typing ? (
        <div className="mt-1 flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-[#D1D5DB]"
            placeholder="type a value"
          />
          <button
            type="button"
            onClick={() => {
              setTyping(false)
              onChange(options[0] ?? '')
            }}
            className="shrink-0 rounded-md border border-[#D1D5DB] px-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            List
          </button>
        </div>
      ) : (
        <select
          id={id}
          className={SELECT_CLASS}
          value={known ? value : ''}
          onChange={(e) => {
            if (e.target.value === CUSTOM) {
              setTyping(true)
              onChange('')
              return
            }
            onChange(e.target.value)
          }}
        >
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={CUSTOM}>Something else…</option>
        </select>
      )}
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  )
}

export function LinkBuilder() {
  // Read once. A link made just before midnight should not change month while
  // it is being copied.
  const now = useMemo(() => new Date(), [])
  const dests = useMemo(() => destinations(), [])
  const allPresets = useMemo(() => presets(), [])

  const [destinationUrl, setDestinationUrl] = useState(APP_URL)
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  const [effort, setEffort] = useState('')
  const [campaignOverride, setCampaignOverride] = useState('')
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  /** Effort plus the current month, unless someone has typed their own. */
  const campaign = campaignOverride.trim() || (effort ? `${effort}_${monthCode(now)}` : '')

  const built = useMemo(
    () => buildLink({ destinationUrl, source, medium, campaign, content }, now),
    [destinationUrl, source, medium, campaign, content, now]
  )

  const ready = built.errors.length === 0

  function applyPreset(id: string) {
    const p = allPresets.find((x) => x.id === id)
    if (!p) return
    const v = p.apply(now)
    setDestinationUrl(v.destinationUrl)
    setSource(v.source)
    setMedium(v.medium)
    setContent(v.content ?? '')
    // The preset carries a full campaign string; drop it into the override so
    // what is shown is exactly what will be sent.
    setCampaignOverride(v.campaign)
    setEffort('')
    setCopied(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(built.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked in some contexts. The URL is on screen and
      // selectable, so this is a convenience rather than the only route.
    }
  }

  const selectedDest = dests.find((d) => d.url === destinationUrl)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#D1D5DB] bg-white p-5">
        <p className="text-sm font-bold text-[#111827]">Start from a link we already use</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className="rounded-xl border-2 border-[#3F6B42] bg-white px-4 py-2 text-sm font-bold text-[#3F6B42] transition hover:bg-[#3F6B42] hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
        <ul className="mt-3 space-y-1">
          {allPresets.map((p) => (
            <li key={p.id} className="text-xs leading-relaxed text-gray-500">
              <span className="font-semibold text-gray-700">{p.label}:</span> {p.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#D1D5DB] bg-white p-5">
        <div className="space-y-4">
          <div>
            <Label htmlFor="lb-dest" className="text-[#111827]">
              Where should the link go?
            </Label>
            <select
              id="lb-dest"
              className={SELECT_CLASS}
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
            >
              {dests.map((d) => (
                <option key={d.url} value={d.url}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{selectedDest?.hint}</p>
          </div>

          <PickOrType
            id="lb-source"
            label="Who is sending it?"
            hint="utm_source — the person or programme this gets credited to."
            options={SOURCES}
            value={source}
            onChange={setSource}
          />

          <PickOrType
            id="lb-medium"
            label="How are they sending it?"
            hint="utm_medium — the mechanism, not the platform’s name."
            options={MEDIUMS}
            value={medium}
            onChange={setMedium}
          />

          <div>
            <Label htmlFor="lb-effort" className="text-[#111827]">
              What effort is this part of?
            </Label>
            <select
              id="lb-effort"
              className={SELECT_CLASS}
              value={effort}
              onChange={(e) => {
                setEffort(e.target.value)
                setCampaignOverride('')
              }}
            >
              <option value="">Choose…</option>
              {EFFORTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              utm_campaign — we add <span className="font-semibold">_{monthCode(now)}</span>{' '}
              automatically so this run can be compared against the next one.
            </p>
            <Input
              id="lb-campaign"
              value={campaignOverride}
              onChange={(e) => setCampaignOverride(e.target.value)}
              placeholder={campaign || `network_${monthCode(now)}`}
              className="mt-2 border-[#D1D5DB] text-sm"
              aria-label="Campaign, if you want to type your own"
            />
            <p className="mt-1 text-xs text-gray-500">Or type your own campaign name here.</p>
          </div>

          <div>
            <Label htmlFor="lb-content" className="text-[#111827]">
              Which person or channel? <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="lb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="maya_nyu, whatsapp, instagram_dm"
              className="mt-1 border-[#D1D5DB]"
            />
            <p className="mt-1 text-xs text-gray-500">
              utm_content — this is what keeps each ambassador, or each channel, separately
              countable while the programme still totals under one source.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-[#3F6B42] bg-[#3F6B42]/[0.04] p-5">
        <p className="text-sm font-bold text-[#111827]">Your link</p>
        {ready ? (
          <>
            <p
              className="mt-2 break-all rounded-lg border border-[#D1D5DB] bg-white p-3 font-mono text-[13px] leading-relaxed text-[#111827]"
              data-testid="lb-url"
            >
              {built.url}
            </p>
            <Button
              onClick={copy}
              className="mt-3 bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
            >
              {copied ? 'Copied ✓' : 'Copy link'}
            </Button>
          </>
        ) : (
          <ul className="mt-2 space-y-1">
            {built.errors.map((e) => (
              <li key={e} className="text-sm text-gray-700">
                {e}
              </li>
            ))}
          </ul>
        )}

        {built.warnings.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-[#3F6B42]/20 pt-3">
            {built.warnings.map((w) => (
              <li key={w} className="text-xs leading-relaxed text-gray-600">
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
