import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import { ConditionalGoogleAnalytics } from '@/components/google-analytics'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeLeap - Your AI Financial Sidekick',
  description: 'WeLeap is your AI financial sidekick. It looks at your full financial picture and gives you one clear next step - a smart Leap - so you are never guessing what to do next.',
  icons: {
    icon: '/icon.svg',
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
        {children}
        <Analytics />
        <CookieConsent />
        <ConditionalGoogleAnalytics />
      </body>
    </html>
  )
}
