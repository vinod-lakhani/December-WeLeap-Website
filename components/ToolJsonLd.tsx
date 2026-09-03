import { JsonLd } from '@/components/JsonLd'
import { toolByHref, toolSchema, faqSchema } from '@/lib/structured-data'
import { faqsByHref } from '@/lib/tool-faqs'

/**
 * Structured data for a calculator route.
 *
 * Every tool layout was carrying the same four lines of lookup-and-emit,
 * which is how the /net-worth-impact layout ended up importing the helpers and
 * never calling them. One component, keyed on the route.
 *
 * FAQPage is emitted only where TOOL_FAQS has entries — and the page renders
 * those same entries, flat and without JavaScript, via `ToolFaq`. Both read the
 * same object, so the markup cannot describe questions a visitor cannot see.
 */
export function ToolJsonLd({ href }: { href: string }) {
  const tool = toolByHref(href)
  const faqs = faqsByHref(href)
  return (
    <>
      {tool && <JsonLd data={toolSchema(tool)} />}
      {faqs && faqs.length > 0 && <JsonLd data={faqSchema(faqs, href)} />}
    </>
  )
}
