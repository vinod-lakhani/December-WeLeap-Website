import type { Metadata } from "next"

/**
 * Metadata for /resources. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  // A plain string here would replace the root's title template for every
  // descendant, so all twelve articles under /resources lost their "| WeLeap"
  // suffix. Re-declaring the template keeps it for children while `default`
  // covers this page itself.
  title: {
    default: 'Resources — money guides for people who are earning and unsure',
    template: '%s | WeLeap',
  },
  description:
    'Practical guides on rent, emergency funds, credit, spending and where your surplus should actually go.',
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'Resources — money guides for people who are earning and unsure | WeLeap',
    description: 'Practical guides on rent, emergency funds, credit, spending and where your surplus should actually go.',
    url: '/resources',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
