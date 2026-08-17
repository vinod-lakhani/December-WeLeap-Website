import type { Metadata } from "next"
import { ToolJsonLd } from '@/components/ToolJsonLd'

/**
 * Metadata for /credit-card-payoff. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'Credit card payoff calculator — when will I be debt free?',
  description:
    'Your payoff date, and how much sooner an extra payment gets you there. See what the minimum-payment trap really costs.',
  alternates: { canonical: '/credit-card-payoff' },
  openGraph: {
    title: 'Credit card payoff calculator — when will I be debt free? | WeLeap',
    description: 'Your payoff date, and how much sooner an extra payment gets you there. See what the minimum-payment trap really costs.',
    url: '/credit-card-payoff',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WebApplication + FAQPage markup for this route. */}
      <ToolJsonLd href="/credit-card-payoff" />
      {children}
    </>
  )
}
