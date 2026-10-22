import type { Metadata } from 'next'
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool'

// Internal test page for the offer calculator with the text opt-in. Not linked from the site.
export const metadata: Metadata = {
  title: 'Offer text pilot (internal)',
  robots: { index: false, follow: false },
}

export default function OfferTextPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Offer calculator with text opt-in</h1>
      <p className="mb-6 text-sm text-stone-600">Internal test page. Not linked from the site.</p>
      <OfferAnalysisTool textPilot />
    </main>
  )
}
