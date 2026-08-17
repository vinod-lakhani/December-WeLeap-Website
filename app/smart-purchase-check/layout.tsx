import type { Metadata } from "next"
import { ToolJsonLd } from '@/components/ToolJsonLd'

/**
 * Metadata for /smart-purchase-check. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'Pay now or pay in 4? Find the smarter move',
  description:
    'Cash, pay-in-4, monthly financing or wait — see which one actually leaves you better off. Free, no account needed.',
  alternates: { canonical: '/smart-purchase-check' },
  openGraph: {
    title: 'Pay now or pay in 4? Find the smarter move | WeLeap',
    description: 'Cash, pay-in-4, monthly financing or wait — see which one actually leaves you better off. Free, no account needed.',
    url: '/smart-purchase-check',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WebApplication + FAQPage markup for this route. */}
      <ToolJsonLd href="/smart-purchase-check" />
      {children}
    </>
  )
}
