import type { Metadata } from "next"
import { JsonLd } from '@/components/JsonLd'
import { toolSchema, toolByHref } from '@/lib/structured-data'

/**
 * Metadata for /allocator. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'Money plan — what should my money do, and in what order?',
  description:
    'Employer match, safety buffer, debt, retirement. See where every dollar should go and the single move worth making first.',
  alternates: { canonical: '/allocator' },
  openGraph: {
    title: 'Money plan — what should my money do, and in what order? | WeLeap',
    description: 'Employer match, safety buffer, debt, retirement. See where every dollar should go and the single move worth making first.',
    url: '/allocator',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const tool = toolByHref('/allocator')
  return (
    <>
      {/* WebApplication markup for this calculator, derived from the
          tools registry so it cannot drift from the card copy. */}
      {tool && <JsonLd data={toolSchema(tool)} />}
      {children}
    </>
  )
}
