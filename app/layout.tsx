import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
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

// Plus Jakarta Sans is the product app's typeface, and the only one the site
// uses. Geist reads as a developer tool, which was a large part of why the site
// felt B2B. GeistMono was still being downloaded here long after that switch,
// but nothing could reach it: tailwind.config.ts extends only `sans`, so
// `font-mono` resolves to Tailwind's default system stack — which is what the
// six `font-mono` usages have been rendering in all along. Dropped.
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
 * the tool pages and every article were indistinguishable
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
  // No `icons` block: the favicon is `app/icon.png`, the App Router file
  // convention, which emits the link tag with the right type and dimensions
  // and cannot drift from a hand-written path. Declaring both would emit two
  // competing <link rel="icon"> tags.
  //
  // Likewise no `openGraph.images` / `twitter.images`: `app/opengraph-image.tsx`
  // is the sitewide card and each tool route overrides it with its own,
  // all resolved per-route by Next.
  openGraph: {
    type: 'website',
    siteName: 'WeLeap',
    locale: 'en_US',
    // `url` deliberately absent. It was set to SITE_URL here, which is only
    // correct for the homepage — every route that defined no openGraph block
    // of its own inherited an og:url pointing at "/". Each route sets its own.
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
    <html lang="en" className={jakarta.variable}>
      <head>
        {/* Site-wide structured data. In <head> so it is in the initial HTML
            for crawlers rather than appearing after hydration. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body className={jakarta.className}>
        <PostHogProvider>
          {/* Both read search params, so both need a Suspense boundary or the
              whole tree opts out of static rendering. */}
          <Suspense fallback={null}>
            <UtmCapture />
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
