import { describe, it, expect } from 'vitest'
import { extractText, getDocumentProxy } from 'unpdf'
import PDFDocument from 'pdfkit'
import { redact } from './redact'

/**
 * The text path, end to end, minus the model call.
 *
 * This builds a real PDF, pulls the text back out with unpdf exactly as the
 * route does, and runs the sweep over it — which is the claim the whole
 * architecture rests on: that personal data in a digital offer letter is
 * removed inside our own process, before any of it is sent anywhere.
 *
 * Asserting that on a hand-written string would prove nothing, because the
 * string would be one I chose. The point is that it holds on bytes that went
 * through a real PDF encoder and a real extractor, with the spacing and line
 * breaks those produce rather than the ones I would have typed.
 */

const LETTER = [
  'ACME ROBOTICS, INC.',
  'Offer of Employment',
  '',
  'Dear Alex Smith,',
  '12 Oak Street, Apt 4B, Austin, TX 78701',
  'SSN on file: 123-45-6789   Employee ID: 4392015583271',
  'Questions? Call 415-555-0142 or email hr@acmerobotics.example.com',
  '',
  'We are pleased to offer you the position of Senior Engineer, based in our',
  'Austin, Texas office, with a start date of March 3, 2026.',
  '',
  'Your annual base salary will be $145,000, paid semi-monthly.',
  'You will be eligible for a target annual bonus of 12% of base salary.',
  'The Company matches 100% of the first 3% of eligible compensation and 50% of',
  'the next 2%.',
  'The Company contributes $1,200 annually to your Health Savings Account.',
  'Your share of the medical premium is $180 per month.',
  'You will receive an RSU grant valued at $240,000, vesting over 4 years.',
  'You may participate in the ESPP at a 15% discount with a six-month lookback.',
  'You will accrue 20 days of paid time off per year.',
]

async function buildPdf(lines: readonly string[]): Promise<Uint8Array> {
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<void>((resolve) => doc.on('end', () => resolve()))
  doc.fontSize(11)
  for (const line of lines) doc.text(line || ' ')
  doc.end()
  await done
  return new Uint8Array(Buffer.concat(chunks))
}

describe('unpdf → redact, on a real PDF', () => {
  it('extracts enough text to take the text path rather than falling back to vision', async () => {
    const pdf = await getDocumentProxy(await buildPdf(LETTER))
    const { totalPages, text } = await extractText(pdf, { mergePages: true })
    expect(totalPages).toBe(1)
    // The route's MIN_TEXT_CHARS threshold.
    expect(text.trim().length).toBeGreaterThanOrEqual(200)
  })

  it('removes every piece of personal data before the text would leave the process', async () => {
    const pdf = await getDocumentProxy(await buildPdf(LETTER))
    const { text } = await extractText(pdf, { mergePages: true })
    const { text: clean, hits } = redact(text)

    expect(hits).toBeGreaterThan(0)
    expect(clean).not.toContain('123-45-6789')
    expect(clean).not.toContain('4392015583271')
    expect(clean).not.toContain('415-555-0142')
    expect(clean).not.toContain('hr@acmerobotics.example.com')
    expect(clean).not.toContain('Oak Street')
    expect(clean).not.toContain('78701')
    // No nine-digit run survives anywhere, however it was spaced.
    expect(clean.replace(/\D/g, '')).not.toContain('123456789')
  })

  it('leaves every compensation figure the parser needs', async () => {
    const pdf = await getDocumentProxy(await buildPdf(LETTER))
    const { text } = await extractText(pdf, { mergePages: true })
    const { text: clean } = redact(text)

    for (const needed of [
      '$145,000', // base salary
      '12%', // bonus target
      '100% of the first 3%', // match, tier one
      '50% of', // match, tier two
      '$1,200', // employer HSA
      '$180 per month', // healthcare premium
      '$240,000', // equity
      '15% discount', // ESPP
      '20 days', // PTO
      'Austin, Texas', // work state
    ]) {
      expect(clean).toContain(needed)
    }
  })

  it('keeps the employee name out of scope rather than pretending to remove it', async () => {
    // Worth being honest about in a test: the sweep does not target names, and
    // no regex reliably can. The control for a name is that fields.ts gives the
    // model nowhere to put one — every field is a bounded number or a state
    // code. A name may survive the sweep; it cannot survive the schema.
    const pdf = await getDocumentProxy(await buildPdf(LETTER))
    const { text } = await extractText(pdf, { mergePages: true })
    expect(redact(text).text).toContain('Alex Smith')
  })
})
