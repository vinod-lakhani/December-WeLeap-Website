import type { Metadata } from 'next'

import { GetRedirect } from '@/components/GetRedirect'

// Redirect landing for the /get smart link — not a content page, keep it out of search.
export const metadata: Metadata = {
  title: 'Get the WeLeap app',
  robots: { index: false, follow: false },
}

export default function GetPage() {
  return <GetRedirect />
}
