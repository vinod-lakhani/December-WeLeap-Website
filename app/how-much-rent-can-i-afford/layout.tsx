import type { Metadata } from "next"

/**
 * Metadata for /how-much-rent-can-i-afford. It lives here rather than in page.tsx because that
 * page is a client component, and Next cannot read `metadata` out of one.
 * The layout is a server component, so the export is picked up normally.
 */
export const metadata: Metadata = {
  title: 'How much rent can I afford?',
  description:
    'Turn your salary into a rent range you can actually live with — after tax, not before. Free, no signup, under a minute.',
  alternates: { canonical: '/how-much-rent-can-i-afford' },
  openGraph: {
    title: 'How much rent can I afford? | WeLeap',
    description: 'Turn your salary into a rent range you can actually live with — after tax, not before. Free, no signup, under a minute.',
    url: '/how-much-rent-can-i-afford',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
