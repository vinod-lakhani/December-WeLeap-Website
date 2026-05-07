import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import { ConditionalGoogleAnalytics } from '@/components/google-analytics'
import { UtmCapture } from '@/components/utm-capture'
import { PostHogProvider } from '@/components/posthog-provider'
import { PostHogPageView } from '@/components/posthog-pageview'
import { Suspense } from 'react'
import './globals.css'

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <PostHogProvider>
          <UtmCapture />
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
          <Analytics />
          <CookieConsent />
          <ConditionalGoogleAnalytics />
        </PostHogProvider>
      </body>
    </html>
  )
}
