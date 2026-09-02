import { track } from '@/lib/analytics'
import { getPostHog } from '@/lib/posthog-lazy'

/**
 * The document-upload funnel, in one place so three surfaces cannot drift.
 *
 * `doc_upload_started`, `doc_uploaded`, `doc_parsed` and `doc_parse_failed`
 * already fire from the upload controls themselves, because that is where the
 * request happens. The two here fire from the FORMS, because that is where the
 * information exists — a field can only be edited, or accepted, somewhere that
 * knows a document supplied it.
 */

/** Matches the `doc_class` on every event in this funnel. */
export type DocClass = 'offer_letter' | 'benefits_guide' | 'paystub'

/**
 * The eval signal that keeps working after launch.
 *
 * A field a user corrects is a field the parser got wrong, and this is the only
 * way to learn that from real documents we never see. It is worth more than the
 * parse-rate numbers: `doc_parsed` says we returned six fields, and only this
 * says whether they were the right six.
 *
 * Fires once per field per session, on the first edit. Somebody dragging a
 * slider produces one signal, not forty, and the interesting fact is that they
 * touched it at all rather than how long they fiddled.
 */
const edited = new Set<string>()

export function trackDocFieldEdited(params: {
  /** The form field, using the tool's own name for it. */
  fieldKey: string
  /** Which document supplied the value being overwritten. */
  docClass: DocClass
  /** The surface, since the same field name can appear on more than one. */
  tool: string
}) {
  const seen = `${params.tool}:${params.fieldKey}`
  if (edited.has(seen)) return
  edited.add(seen)
  track('doc_field_edited', {
    field_key: params.fieldKey,
    doc_class: params.docClass,
    tool: params.tool,
  })
}

/**
 * The user took the document's numbers forward.
 *
 * Pairs with `doc_parsed` to answer the question the parse rate cannot: of the
 * people whose document we read, how many acted on it without correcting it
 * first. `fields_edited` alongside `fields_from_doc` is the whole story in two
 * numbers.
 */
export function trackDocConfirmed(params: {
  docClasses: DocClass[]
  fieldsFromDoc: number
  fieldsEdited: number
  tool: string
}) {
  track('doc_confirmed', {
    // Sorted and joined rather than an array: a visitor can supply an offer
    // letter and a benefits guide, and "benefits_guide,offer_letter" groups
    // cleanly in a funnel where an unordered array would not.
    doc_class: [...params.docClasses].sort().join(','),
    doc_count: params.docClasses.length,
    fields_from_doc: params.fieldsFromDoc,
    fields_edited: params.fieldsEdited,
    tool: params.tool,
  })
}

/**
 * Stamps the visitor with the first document class they were read from.
 *
 * `register_once`, matching how `entry_src` is handled in lib/utm-storage: the
 * first document wins and later ones cannot overwrite it. Because the alias
 * chain already stitches weleap.ai to the app, this makes every downstream
 * event attributable to the document that brought the person in, with no join —
 * which is what answers whether paystub uploaders behave differently from offer
 * letter uploaders.
 */
export function stampFirstDocClass(docClass: DocClass) {
  try {
    getPostHog().register_once({ first_doc_class: docClass })
  } catch {
    // Analytics must never break an upload. A missing super property costs a
    // breakdown; an exception here costs the user their parse.
  }
}
