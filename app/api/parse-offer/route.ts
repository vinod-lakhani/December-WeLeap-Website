import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText, getDocumentProxy } from 'unpdf'
import { US_STATES } from '@/lib/states'
import {
  OFFER_FIELDS,
  OFFER_FIELD_KEYS,
  BENEFITS_FIELD_KEYS,
  BENEFITS_DESCRIPTIONS,
  WORK_STATE_DESCRIPTION,
} from '@/lib/offer-parse/fields'
import { redact } from '@/lib/offer-parse/redact'
import { quoteIsGrounded } from '@/lib/offer-parse/grounding'
import { validateExtraction, mergeToolInputs } from '@/lib/offer-parse/validate'

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

export type DocKind = 'offer' | 'benefits'

/** The schema is generated from the field table so the two cannot drift. */
function buildTool(kind: DocKind): Anthropic.Tool {
  const properties: Record<string, unknown> = {}
  const keys = kind === 'benefits' ? BENEFITS_FIELD_KEYS : OFFER_FIELD_KEYS

  for (const key of keys) {
    const spec = OFFER_FIELDS[key]
    const describe =
      kind === 'benefits'
        ? BENEFITS_DESCRIPTIONS[key as (typeof BENEFITS_FIELD_KEYS)[number]]
        : spec.describe
    properties[key] = {
      type: 'object',
      // The range goes in the description, not as `minimum`/`maximum`: a
      // strict tool schema rejects those on a number outright —
      // "For 'number' type, properties maximum, minimum are not supported".
      // Which is the right split anyway. The schema advertises the range so
      // the model aims at it; validateExtraction enforces it, and that is the
      // half that has to be true. A constraint the API silently dropped would
      // have been worse than one it refused.
      description: `${describe} Expected range: ${spec.min} to ${spec.max}.`,
      properties: {
        value: { type: 'number' },
        confidence: { type: 'number' },
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

  // A benefits guide describes a plan, not a posting — it has no work location.
  if (kind === 'offer') {
    properties.workStateCode = {
      type: 'object',
      description: WORK_STATE_DESCRIPTION,
      properties: {
        value: { type: 'string', enum: [...US_STATES] },
        confidence: { type: 'number' },
        quote: { type: 'string' },
      },
      required: ['value', 'confidence', 'quote'],
      additionalProperties: false,
    }
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

const OFFER_SYSTEM = [
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
  '6. Go through every field in the schema in turn and decide on each one before',
  '   you call the tool. Do not stop once you have the headline money numbers.',
  '   Terms like time off are easy to skip past among the dollar figures and',
  '   they change the answer just as much.',
].join('\n')

/**
 * A benefits guide is a different reading problem from an offer letter.
 *
 * A letter states one number and means it. A guide is a reference document: it
 * lists every plan, every tier and every illustrative example, and most of what
 * it says is about someone other than this reader. The rules below are the ones
 * that went wrong on a real guide under test — an illustrative contribution
 * table sitting under the actual match formula, a family HSA figure next to the
 * employee-only one, three premiums where the tool has one field.
 */
const BENEFITS_SYSTEM = [
  'You read US employee benefits guides and record four things from them: the',
  '401(k) match formula, the employer HSA contribution, and the employee medical',
  'premium.',
  '',
  'Call the record_offer_terms tool exactly once.',
  '',
  'Rules, in order of importance:',
  '1. Omit any field the document does not state. Never infer a typical value.',
  '   A missing field costs the reader nothing; a guessed one gives them a wrong',
  '   number they have no reason to doubt.',
  '2. Every field you return needs a verbatim quote from the document.',
  '3. Read the match from the PROSE formula, not from an illustrative table of',
  '   example contribution rates. Such a table shows what different employees',
  '   would receive; it is not the formula.',
  '4. Where the guide lists several medical plans or coverage tiers, the figures',
  '   you return must all describe ONE scenario: employee-only coverage on the',
  '   HSA-eligible plan. Name that plan in your quote.',
  '5. Record only the fields in the schema. Do not report names, addresses,',
  '   identifiers or any other personal detail, including in quotes.',
  '6. If this is not a benefits guide, call the tool with no fields set.',
].join('\n')


export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Same shape as every other failure: the client shows the form and the user
    // types. An unconfigured key must never look different from a bad scan.
    return NextResponse.json({ error: 'upload_unavailable' }, { status: 503 })
  }

  let file: File
  let kind: DocKind = 'offer'
  try {
    const form = await request.formData()
    const candidate = form.get('file')
    if (!(candidate instanceof File)) {
      return NextResponse.json({ error: 'no_file' }, { status: 400 })
    }
    file = candidate
    // Told, not detected. The user picked a button that says which document
    // they are handing over, so there is no classifier to be wrong — and a
    // misclassification here would read the right numbers off the wrong
    // document, which validation cannot catch.
    kind = form.get('kind') === 'benefits' ? 'benefits' : 'offer'
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
  /** The text the model was given, kept so its quotes can be checked. */
  let sourceText = ''

  if (type.kind === 'pdf') {
    let text = ''
    try {
      /**
       * A COPY, and this is not defensive style — it is required.
       *
       * PDF.js takes ownership of the buffer it is handed and detaches it.
       * After `getDocumentProxy(buf)` the original view has length 0, so the
       * vision fallback below was base64-encoding nothing and the API replied
       * "PDF cannot be empty". That only bites when extraction finds no text,
       * which is exactly when the fallback is the one thing that matters: every
       * scanned or photographed PDF failed, and no digital one did.
       */
      const pdf = await getDocumentProxy(new Uint8Array(buf))
      text = (await extractText(pdf, { mergePages: true })).text
    } catch {
      // A PDF unpdf cannot open still renders for the model. Fall through.
      text = ''
    }

    if (text.trim().length >= MIN_TEXT_CHARS) {
      const swept = redact(text)
      redactions = swept.hits
      path = 'text'
      sourceText = swept.text
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
      /**
       * Thinking tokens count against this, and adaptive thinking is on by
       * default. At 4000 the model spent the entire budget reasoning and the
       * tool call came back truncated — stop_reason "max_tokens", exactly 4000
       * output tokens, and the last field silently missing on every single run.
       * It read as a clean success, which is the worst way for it to fail.
       *
       * The extracted fields themselves are ~1.5k tokens. The rest is headroom
       * for thinking, and it is cheap headroom: nothing bills for tokens the
       * model does not generate.
       */
      max_tokens: 16000,
      /**
       * Low, not medium. This is field extraction against a fixed schema, not
       * a problem that rewards deliberation, and the depth was costing 30
       * seconds a call without buying accuracy. Re-tune against the golden set.
       */
      output_config: { effort: 'low' },
      system: kind === 'benefits' ? BENEFITS_SYSTEM : OFFER_SYSTEM,
      tools: [buildTool(kind)],
      messages: [{ role: 'user', content: content! }],
    })

    /**
     * A truncated response is a silent data-loss bug, so it is named.
     *
     * The fields that did arrive are individually valid — each one passed range
     * and quote checks — so they are still returned. What must not happen is
     * the caller believing the document had nothing more in it.
     */
    const truncated = response.stop_reason === 'max_tokens'
    if (truncated) {
      console.warn('[parse-offer] response truncated at max_tokens', {
        outputTokens: response.usage.output_tokens,
        path,
      })
    }

    /**
     * Every tool_use block, not the first one.
     *
     * Parallel tool use is on by default, and the model genuinely uses it here:
     * on a real letter it returned the money fields in one block and `ptoDays`
     * in a second. Reading only the first — which is what `.find()` did — threw
     * away a correctly extracted field on every single run, and looked like the
     * model had simply missed it. Nine of ten fields is a plausible enough
     * result that the bug survived several rounds of prompt tuning aimed at the
     * wrong thing.
     */
    const calls = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'record_offer_terms'
    )
    // No tool call is a parse failure, not an error. The form is untouched and
    // the user types, exactly as they would have without the upload.
    if (calls.length === 0) {
      return NextResponse.json({ parsed: {}, kind, path, fieldsFound: 0, redactions })
    }

    const { parsed, rejected } = validateExtraction(mergeToolInputs(calls.map((c) => c.input)))

    /**
     * Drop anything whose quote is not in the document.
     *
     * Same rule as everywhere else here: a field that fails a check is removed
     * rather than repaired, because the alternative is a number shown under a
     * citation that does not support it. Only on the text path — a scan leaves
     * nothing to check against, and asserting grounding we did not test would
     * be worse than admitting we could not.
     */
    let ungrounded = 0
    if (path === 'text') {
      for (const [key, field] of Object.entries(parsed)) {
        if (field && !quoteIsGrounded(field.quote, sourceText)) {
          // The key, never the quote: this line has to be safe to read in a
          // production log, and the quote is document content.
          console.warn('[parse-offer] quote not found in document', { key, path })
          delete (parsed as Record<string, unknown>)[key]
          ungrounded += 1
        }
      }
    }
    return NextResponse.json({
      parsed,
      kind,
      path,
      redactions,
      fieldsFound: Object.keys(parsed).length,
      rejectedCount: rejected.length + ungrounded,
      ungrounded,
      latencyMs: Date.now() - started,
      truncated,
      outputTokens: response.usage.output_tokens,
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
