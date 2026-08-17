import type { Metadata } from 'next'

/**
 * Exists only to carry metadata. `app/early-access/page.tsx` is a client
 * component and cannot export it, and this route does not need converting — it
 * is a flow-entry page, not a destination we want ranked.
 *
 * Applies to `/early-access/videos` too, which inherits it and should also be
 * noindex.
 *
 * `robots.txt` already disallows both, but Disallow blocks crawling rather than
 * indexing: a disallowed URL can still be indexed URL-only if something links
 * to it, and the disallow is precisely what prevents Google from reading a
 * noindex. The directive has to be on the page to be readable.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function EarlyAccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
