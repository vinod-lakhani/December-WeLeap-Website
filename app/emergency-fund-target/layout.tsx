import type { Metadata } from "next"

/**
 * Metadata for /emergency-fund-target. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'Emergency fund calculator — how much do I actually need?',
  description:
    'Not everyone needs six months. Find the number that fits your income, your expenses and how stable your job is.',
  alternates: { canonical: '/emergency-fund-target' },
  openGraph: {
    title: 'Emergency fund calculator — how much do I actually need? | WeLeap',
    description: 'Not everyone needs six months. Find the number that fits your income, your expenses and how stable your job is.',
    url: '/emergency-fund-target',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
