/**
 * Renders a JSON-LD block.
 *
 * Server component on purpose: structured data has to be in the initial HTML
 * for a crawler to see it, so this must not depend on hydration.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own constants, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
