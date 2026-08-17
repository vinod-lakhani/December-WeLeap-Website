import type { Metadata } from "next"
import { ToolJsonLd } from '@/components/ToolJsonLd'

/**
 * Metadata for /offer. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'Offer letter analyzer — what is your offer really worth?',
  description:
    'An offer has seven numbers and most people only read one. See what the whole package is worth before you sign.',
  alternates: { canonical: '/offer' },
  openGraph: {
    title: 'Offer letter analyzer — what is your offer really worth? | WeLeap',
    description: 'An offer has seven numbers and most people only read one. See what the whole package is worth before you sign.',
    url: '/offer',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WebApplication + FAQPage markup for this route. */}
      <ToolJsonLd href="/offer" />
      {children}
    </>
  )
}
