import type { Metadata } from 'next'

/**
 * Exists only to carry metadata. `app/join/page.tsx` is a client component and
 * cannot export it, and this route does not need converting — it is a campaign
 * flow-entry page, not a destination we want ranked.
 *
 * `robots.txt` already disallows /join, but Disallow blocks crawling rather
 * than indexing: a disallowed URL can still be indexed URL-only if something
 * links to it, and the disallow is precisely what prevents Google from reading
 * a noindex. The directive has to be on the page to be readable.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
