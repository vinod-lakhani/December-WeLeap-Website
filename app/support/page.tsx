import type { Metadata } from 'next'
import Link from 'next/link'
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { JsonLd } from '@/components/JsonLd'
import { faqSchema } from '@/lib/structured-data'
import { SUPPORT_FAQS, SUPPORT_EMAIL, SUPPORT_RESPONSE_TIME } from '@/lib/support-faqs'
import { TYPOGRAPHY } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'

/**
 * /support — the App Store support URL, and the page people find by searching
 * "weleap support".
 *
 * THE CONTACT METHOD IS ABOVE EVERYTHING ELSE, and that is a requirement
 * rather than a preference. App Review rejects support URLs with the message
 * "your support URL does not provide contact information", and an FAQ on its
 * own does not satisfy it — nor does a contact buried in a footer, behind a
 * menu, or behind a sales funnel. So the email is the first thing on the page,
 * at a size that is tappable on a phone, before any other content.
 *
 * A mailto rather than a contact form on purpose. A form needs an endpoint,
 * and an endpoint that is down on the day a reviewer opens this page is a
 * rejection. A mailto has nothing to break.
 *
 * The account section is doing two jobs. It is the highest-volume real support
 * question for a product that connects bank accounts, and it is also the
 * evidence a reviewer is looking for that account deletion is genuinely
 * self-serve — which is what guideline 5.1.1(v) asks for and what the privacy
 * policy now claims.
 */

const DESCRIPTION =
  'Get help with WeLeap — closing your account, downloading your data, bank connections, emails and texts. Email support@weleap.ai and we reply within 2 business days.'

export const metadata: Metadata = {
  title: 'Support',
  description: DESCRIPTION,
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Support | WeLeap',
    description: DESCRIPTION,
    url: '/support',
    images: [DEFAULT_OG_IMAGE],
  },
}

/** The self-serve controls, named exactly as they appear in the app. */
const ACCOUNT_ACTIONS = [
  {
    t: 'Close my account',
    d: 'Permanently deletes your account and everything in it, and revokes any bank connections. You do not need to contact us, and it cannot be undone.',
  },
  {
    t: 'Delete my data',
    d: 'Erases the information we hold about you but leaves your account open, so you can start again without signing up twice.',
  },
  {
    t: 'Download my data',
    d: 'Gives you a copy of what we hold. Worth doing before either of the above.',
  },
]

export default function SupportPage() {
  return (
    <PageShell>
      <JsonLd data={faqSchema(SUPPORT_FAQS, '/support')} />

      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, 'mb-3 text-white md:mb-4')}>Support</h1>
          <p className={cn(TYPOGRAPHY.subtext, 'text-white/85')}>
            A real person reads every message.
          </p>
        </Container>
      </Section>

      {/* Contact first, before anything else on the page. See the file note. */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <div className="rounded-2xl border-2 border-[#386641] bg-[#386641]/[0.04] p-6 text-center md:p-8">
            <p className={cn(TYPOGRAPHY.subtext, 'text-gray-700')}>Email us at</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              /* py-3 rather than a bare inline link: as text alone the tap target
                 came out 27px tall, under the 44px minimum, and App Review
                 lists un-tappable buttons as a mobile-optimisation rejection
                 for support URLs. */
              className="mt-2 inline-block break-all px-2 py-3 text-[clamp(1.35rem,4.5vw,2rem)] font-extrabold leading-tight text-[#386641] underline decoration-2 underline-offset-4 hover:text-[#2d5235]"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className={cn('mt-4', TYPOGRAPHY.subtext, 'text-gray-700')}>
              We reply {SUPPORT_RESPONSE_TIME}, and usually sooner.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              It helps if you tell us what you were doing, what you expected to happen, and what
              happened instead. If it is about the iOS app, the app version and your device model
              save us a round trip.
            </p>
          </div>
        </Container>
      </Section>

      <Section variant="white" className="pt-0">
        <Container maxWidth="narrow">
          <div className="space-y-8 text-gray-700 md:space-y-10">
            {/* Highest-volume question, and the 5.1.1(v) evidence. */}
            <section className="space-y-3 md:space-y-4">
              <h2 className={cn(TYPOGRAPHY.h3, 'mb-3 text-gray-900 md:mb-4')}>
                Closing your account, or getting your data
              </h2>
              <p className={cn(TYPOGRAPHY.subtext, 'text-gray-700')}>
                All three of these are in the app, under{' '}
                <strong>Profile &rarr; Security &amp; Data</strong>. You do not need to email us to
                use any of them.
              </p>
              <dl className="space-y-4">
                {ACCOUNT_ACTIONS.map((a) => (
                  <div key={a.t} className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-base font-bold text-gray-900">{a.t}</dt>
                    <dd className={cn('mt-1', TYPOGRAPHY.subtext, 'text-gray-700')}>{a.d}</dd>
                  </div>
                ))}
              </dl>
              <p className={cn(TYPOGRAPHY.subtext, 'text-gray-700')}>
                If you have lost access to the app, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline">
                  {SUPPORT_EMAIL}
                </a>{' '}
                from the address on your account and we will do it for you. How long anything is
                kept afterwards is set out in our{' '}
                <Link href="/privacy-policy" className="text-primary-600 hover:underline">
                  privacy policy
                </Link>
                .
              </p>
            </section>

            <section className="space-y-3 md:space-y-4">
              <h2 className={cn(TYPOGRAPHY.h3, 'mb-3 text-gray-900 md:mb-4')}>Common questions</h2>
              <dl className="space-y-5">
                {SUPPORT_FAQS.map((f) => (
                  <div key={f.q}>
                    <dt className="mb-1.5 text-base font-semibold text-gray-900">{f.q}</dt>
                    <dd className={cn(TYPOGRAPHY.subtext, 'text-gray-700')}>{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-3 md:space-y-4">
              <h2 className={cn(TYPOGRAPHY.h3, 'mb-3 text-gray-900 md:mb-4')}>
                A note on what we can help with
              </h2>
              <p className={cn(TYPOGRAPHY.subtext, 'text-gray-700')}>
                We can help with anything about the product: your account, your connections, a
                number that looks wrong, a feature that will not work. We cannot give you
                personalised financial, investment, legal or tax advice, because we are not licensed
                to and it would be the wrong thing to take from a support inbox. If a question needs
                that, we will say so rather than guess.
              </p>
            </section>

            <section className="space-y-3 md:space-y-4">
              <h2 className={cn(TYPOGRAPHY.h3, 'mb-3 text-gray-900 md:mb-4')}>Other pages</h2>
              <ul
                className={cn(
                  'list-disc space-y-2 pl-5 md:pl-6',
                  TYPOGRAPHY.subtext,
                  'text-gray-700'
                )}
              >
                <li>
                  <Link href="/privacy-policy" className="text-primary-600 hover:underline">
                    Privacy policy
                  </Link>{' '}
                  — what we collect, how long we keep it, and your rights.
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-primary-600 hover:underline">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/sms-notifications" className="text-primary-600 hover:underline">
                    SMS notifications
                  </Link>{' '}
                  — opting in, opting out, and the keywords.
                </li>
                <li>
                  <Link href="/tools" className="text-primary-600 hover:underline">
                    Free tools
                  </Link>{' '}
                  — calculators that need no account at all.
                </li>
              </ul>
            </section>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
