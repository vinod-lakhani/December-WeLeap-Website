import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbSchema, toolByHref } from '@/lib/structured-data'

/**
 * The breadcrumb trail for a calculator route — visible markup and
 * BreadcrumbList JSON-LD from one component, so the two cannot describe
 * different paths.
 *
 * It earns its place twice. The tools live at flat top-level URLs, so nothing
 * else on the page or in the address bar says /offer sits under /tools; and it
 * is the link back to the index, which on a flat site is the only structural
 * signal that the seven calculators are one set.
 *
 * Server component: the trail and the schema both have to be in the initial
 * HTML, and neither depends on state.
 */
export function ToolBreadcrumb({ href }: { href: string }) {
  const tool = toolByHref(href)
  if (!tool) return null

  return (
    <>
      <JsonLd data={breadcrumbSchema(tool)} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13.5px] text-faint">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline underline-offset-2">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/tools" className="hover:text-brand-700 hover:underline underline-offset-2">
              Free money tools
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page" className="text-subtle">
              {tool.name}
            </span>
          </li>
        </ol>
      </nav>
    </>
  )
}
