import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText, getDocumentProxy } from 'unpdf'
import { US_STATES } from '@/lib/states'
import { OFFER_FIELDS, OFFER_FIELD_KEYS, WORK_STATE_DESCRIPTION } from '@/lib/offer-parse/fields'
import { redact } from '@/lib/offer-parse/redact'
import { validateExtraction } from '@/lib/offer-parse/validate'

/**
 * Read an offer letter and hand the numbers back to the form.
 *
 * The form is the confirmation screen. Nothing here writes anywhere — the
 * response is a set of values the client drops into the inputs the user was
 * going to fill in by hand, all of them still editable. That is the whole
 * safety model, and it is why there is no session store, no confirmation
 * surface and no persistence: on this site a calculator's state already lives
 * in the browser and dies with the tab.
 *
 * Two paths in, and the difference is worth understanding:
 *
 *   TEXT   A digital PDF has a text layer. unpdf pulls it out here, in this
 *          function, and the PII sweep runs on it BEFORE the model is called.
 *          Nothing leaves without passing that filter.
 *
 *   VISION A scan, a photo or an image has no text layer to sweep, so the page
 *          goes to the model as-is and the output schema in fields.ts is the
 *          only control. Still a real control — every field is a bounded
 *          number or a state code — but a weaker one, so the response says
 *          which path ran.
 *
 * The file is never written to disk or object storage. It exists as a buffer
 * for the life of the request.
 */

export const runtime = 'nodejs'
/**
 * The default is far too short for a model call on a multi-page document, and
 * no route in this project set one before now. A timeout here surfaces as a
 * failed parse, which falls back to typing — but it costs the user 15 seconds
 * first, so the ceiling is set well above the p90 we expect.
 */
export const maxDuration = 60

/**
 * Vercel rejects a request body over 4.5 MB before it reaches this handler, so
 * the cap is ours to enforce below that, not at the 32 MB the model API allows.
 * Offer letters are one to three pages and almost always well under a megabyte;
 * the spec's 20 MB ceiling was sized for benefits guides, which this is not.
 */
const MAX_BYTES = 4 * 1024 * 1024

/**
 * Below this many characters, a "successful" text extraction is really an empty
 * one — a scanned page wrapped in a PDF returns a handful of stray glyphs. Send
 * those to the model and it reads nothing; send the image instead and it works.
 */
const MIN_TEXT_CHARS = 200

const MAGIC: ReadonlyArray<{ bytes: number[]; media: string; kind: 'pdf' | 'image' }> = [
  { bytes: [0x25, 0x50, 0x44, 0x46], media: 'application/pdf', kind: 'pdf' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], media: 'image/png', kind: 'image' },
  { bytes: [0xff, 0xd8, 0xff], media: 'image/jpeg', kind: 'image' },
]

/** Trust the bytes, not the extension or the browser-supplied MIME type. */
function sniff(buf: Uint8Array) {
  return MAGIC.find((m) => m.bytes.every((b, i) => buf[i] === b)) ?? null
}

/** The schema is generated from the field table so the two cannot drift. */
function buildTool(): Anthropic.Tool {
  const properties: Record<string, unknown> = {}

  for (const key of OFFER_FIELD_KEYS) {
    const spec = OFFER_FIELDS[key]
    properties[key] = {
      type: 'object',
      description: spec.describe,
      properties: {
        value: { type: 'number', minimum: spec.min, maximum: spec.max },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        quote: {
          type: 'string',
          description:
            'The exact sentence or line from the document this value was read from. Copy it verbatim.',
        },
      },
      required: ['value', 'confidence', 'quote'],
      additionalProperties: false,
    }
  }

  properties.workStateCode = {
    type: 'object',
    description: WORK_STATE_DESCRIPTION,
    properties: {
      value: { type: 'string', enum: [...US_STATES] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      quote: { type: 'string' },
    },
    required: ['value', 'confidence', 'quote'],
    additionalProperties: false,
  }

  return {
    name: 'record_offer_terms',
    description:
      'Record the compensation terms found in this offer letter. Omit any field the document does not state.',
    input_schema: { type: 'object', properties, additionalProperties: false } as Anthropic.Tool['input_schema'],
    // Guarantees the input validates against the schema above, so a value can
    // never arrive as a string like "$145,000" that then coerces to NaN.
    strict: true,
  }
}

const SYSTEM = [
  'You read US employment offer letters and record the compensation terms in them.',
  '',
  'Call the record_offer_terms tool exactly once with everything you find.',
  '',
  'Rules, in order of importance:',
  '1. Omit any field the document does not actually state. A missing field costs',
  '   the reader nothing; a guessed one gives them a wrong number they have no',
  '   reason to doubt. Never infer a typical value.',
  '2. Every field you return needs a verbatim quote from the document. If you',
  '   cannot quote it, do not return it.',
  '3. Set confidence honestly. Below 0.6 the field is discarded, which is the',
  '   correct outcome for a value you are unsure of.',
  '4. Record only the fields in the schema. Do not report names, addresses,',
  '   identifiers or any other personal detail anywhere, including in quotes.',
  '5. If the document is not an offer letter, call the tool with no fields set.',
].join('\n')

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Same shape as every other failure: the client shows the form and the user
    // types. An unconfigured key must never look different from a bad scan.
    return NextResponse.json({ error: 'upload_unavailable' }, { status: 503 })
  }

  let file: File
  try {
    const form = await request.formData()
    const candidate = form.get('file')
    if (!(candidate instanceof File)) {
      return NextResponse.json({ error: 'no_file' }, { status: 400 })
    }
    file = candidate
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  if (file.size === 0) return NextResponse.json({ error: 'empty_file' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 })
  }

  const buf = new Uint8Array(await file.arrayBuffer())
  const type = sniff(buf)
  if (!type) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })

  let content: Anthropic.MessageParam['content']
  let path: 'text' | 'vision' = 'vision'
  let redactions = 0

  if (type.kind === 'pdf') {
    let text = ''
    try {
      const pdf = await getDocumentProxy(buf)
      text = (await extractText(pdf, { mergePages: true })).text
    } catch {
      // A PDF unpdf cannot open still renders for the model. Fall through.
      text = ''
    }

    if (text.trim().length >= MIN_TEXT_CHARS) {
      const swept = redact(text)
      redactions = swept.hits
      path = 'text'
      content = [
        { type: 'text', text: `<offer_letter>\n${swept.text.slice(0, 120_000)}\n</offer_letter>` },
      ]
    }
  }

  if (path === 'vision') {
    content =
      type.kind === 'pdf'
        ? [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(buf).toString('base64') },
            },
          ]
        : [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: type.media as 'image/png' | 'image/jpeg',
                data: Buffer.from(buf).toString('base64'),
              },
            },
          ]
  }

  const started = Date.now()
  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4000,
      // Bounded extraction against a fixed schema, not open reasoning. Tune
      // this against the golden set rather than by feel — it is the cheapest
      // lever on both latency and precision.
      output_config: { effort: 'medium' },
      system: SYSTEM,
      tools: [buildTool()],
      messages: [{ role: 'user', content: content! }],
    })

    const call = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'record_offer_terms'
    )
    // No tool call is a parse failure, not an error. The form is untouched and
    // the user types, exactly as they would have without the upload.
    if (!call) {
      return NextResponse.json({ parsed: {}, path, fieldsFound: 0, redactions })
    }

    const { parsed, rejected } = validateExtraction(call.input)
    return NextResponse.json({
      parsed,
      path,
      redactions,
      fieldsFound: Object.keys(parsed).length,
      rejectedCount: rejected.length,
      latencyMs: Date.now() - started,
    })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'busy' }, { status: 429 })
    }
    console.error('[parse-offer] extraction failed', {
      // Never the document, never the model output — only the shape of the
      // failure. This log line is read when uploads start failing, and it must
      // be safe to read.
      name: error instanceof Error ? error.name : 'unknown',
      status: error instanceof Anthropic.APIError ? error.status : undefined,
      path,
    })
    return NextResponse.json({ error: 'parse_failed' }, { status: 502 })
  }
}
