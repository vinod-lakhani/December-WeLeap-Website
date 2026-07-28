import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import { ConditionalGoogleAnalytics } from '@/components/google-analytics'
import { UtmCapture } from '@/components/utm-capture'
import { PostHogProvider } from '@/components/posthog-provider'
import { PostHogPageView } from '@/components/posthog-pageview'
import { MetaPixel } from '@/components/meta-pixel'
import { Suspense } from 'react'
import './globals.css'

// Plus Jakarta Sans is the product app's typeface. Geist reads as a developer
// tool, which was a large part of why the site felt B2B.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'WeLeap - Your AI Financial Sidekick',
  description: 'WeLeap is your AI financial sidekick. It looks at your full financial picture and gives you one clear next step - a smart Leap - so you are never guessing what to do next.',
  icons: {
    icon: '/images/Icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${GeistMono.variable}`}>
      <body className={jakarta.className}>
        <PostHogProvider>
          <UtmCapture />
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
          <Analytics />
          <CookieConsent />
          <ConditionalGoogleAnalytics />
          <MetaPixel />
        </PostHogProvider>
      </body>
    </html>
  )
}
