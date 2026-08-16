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
import { JsonLd } from '@/components/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/structured-data'
import './globals.css'

// Plus Jakarta Sans is the product app's typeface. Geist reads as a developer
// tool, which was a large part of why the site felt B2B.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'

/**
 * Root metadata, and the defaults every page inherits.
 *
 * Two things were missing and both mattered. There was no metadataBase, so
 * Open Graph and Twitter image paths resolved relative and social previews
 * broke. And there was no title template, so the twenty-nine pages without
 * their own metadata all rendered as the same title in search results —
 * /offer, /how-much-rent-can-i-afford and every article were indistinguishable
 * to Google.
 *
 * `title.template` means a page sets only its own name; `title.default` is
 * what the homepage and anything still without metadata falls back to.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'WeLeap — Your AI Financial Sidekick',
    template: '%s | WeLeap',
  },
  description:
    'WeLeap is your AI financial sidekick. It looks at your full financial picture and gives you one clear next step — a Leap — so you are never guessing what to do next.',
  applicationName: 'WeLeap',
  icons: {
    icon: '/images/Icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'WeLeap',
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${GeistMono.variable}`}>
      <head>
        {/* Site-wide structured data. In <head> so it is in the initial HTML
            for crawlers rather than appearing after hydration. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
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
