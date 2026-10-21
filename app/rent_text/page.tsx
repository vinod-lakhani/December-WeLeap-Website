import type { Metadata } from 'next'
import { RentTool } from '@/components/RentTool'

// Internal test page for the rent calculator with the text opt-in. Not linked from the site.
export const metadata: Metadata = {
  title: 'Rent text pilot (internal)',
  robots: { index: false, follow: false },
}

export default function RentTextPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Rent calculator with text opt-in</h1>
      <p className="mb-6 text-sm text-stone-600">Internal test page. Not linked from the site.</p>
      <RentTool textPilot />
    </main>
  )
}
