import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How WeLeap collects, uses and protects your information, including bank data via Plaid, email and SMS.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy policy | WeLeap',
    description: 'How WeLeap collects, uses and protects your information, including bank data via Plaid, email and SMS.',
    url: '/privacy-policy',
    images: [DEFAULT_OG_IMAGE],
  },
}


export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-3 md:mb-4")}>Privacy Policy</h1>
          <p className={cn(TYPOGRAPHY.subtext, "text-white/85")}>Effective Date: September 4, 2026</p>
        </Container>
      </Section>

      <Section variant="white">
        <Container maxWidth="narrow">
          <Link href="/" className={cn("inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Back to Home
          </Link>

          <article className="prose prose-lg max-w-none">
            <div className="space-y-6 md:space-y-8 text-gray-700 leading-relaxed">
              <p className={cn(TYPOGRAPHY.body, "text-gray-700")}>
                At WeLeap, your privacy is our priority. This Privacy Policy explains how we collect, use, share, and protect your information when you use our services.
              </p>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Who Can Use WeLeap</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is intended only for individuals who are 18 years of age or older. By creating an account or using our services, you confirm that you are at least 18.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We do not knowingly collect personal information from children under 13, and our services are not directed to children. If we learn that we have collected personal information from a child under 13, we will delete that information promptly. If you believe a child has provided us with personal information, please contact us at{' '}
                  <a href="mailto:support@weleap.ai" className="text-primary-600 hover:underline">support@weleap.ai</a>.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Collect</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2 md:space-y-3", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>
                    <strong>Information you provide:</strong> This may include your name, email address, mobile phone number, financial goals, preferences, and basic demographic information.
                  </li>
                  <li>
                    <strong>Financial data, with your consent:</strong> If you choose to connect financial accounts, we may collect transaction, balance, and account information through integrations such as Plaid.
                  </li>
                  <li>
                    <strong>Communications information:</strong> If you sign up to receive email or SMS communications from WeLeap, we may collect your email address, mobile phone number, communication preferences, message delivery status, and related metadata.
                  </li>
                  <li>
                    <strong>Usage data:</strong> We may collect information about how you interact with WeLeap so we can improve the product, personalize your experience, and make our recommendations more useful.
                  </li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>How We Use Your Information</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>Generate personalized financial reports, insights, reminders, alerts, and recommendations.</li>
                  <li>Help you understand your income, spending, savings, debt, and financial goals.</li>
                  <li>Provide onboarding, customer support, product updates, and service-related communications.</li>
                  <li>Send email communications through providers such as Postmark.</li>
                  <li>Send SMS/text messages through providers such as Twilio, if you opt in.</li>
                  <li>Improve our models, recommendations, and services, including through anonymized and aggregated analysis.</li>
                  <li>Maintain the security, reliability, and performance of our services.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>SMS/Text Messaging</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you provide your mobile phone number and opt in to receive text messages from WeLeap, we may send you SMS messages related to your account, onboarding, product updates, financial sidekick notifications, reminders, alerts, and other service-related communications.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Message frequency may vary based on your account activity, preferences, and use of WeLeap. Message and data rates may apply.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You may opt out of receiving SMS messages at any time by replying <strong>STOP</strong> to any text message from us. You may request help by replying <strong>HELP</strong>.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We use Twilio and related service providers to deliver SMS messages. These providers process mobile numbers and message-related information only as needed to provide messaging services on our behalf.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 font-medium")}>
                  We do not sell, rent, share, or disclose your mobile phone number, SMS opt-in information, or text messaging consent to third parties or affiliates for their marketing or promotional purposes.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Email Communications</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may send you emails related to your account, onboarding, product updates, financial sidekick notifications, waitlist updates, newsletters, and other relevant communications.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may use Postmark and related service providers to deliver and manage these emails. These providers may process your email address, message content, delivery status, open/click information, bounce information, unsubscribe information, and related metadata only as needed to provide email delivery, analytics, compliance, and security services on our behalf.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You may unsubscribe from marketing emails by using the unsubscribe link included in those emails. We may still send you transactional or service-related emails when necessary to operate your account, provide requested services, or communicate important updates.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>How We Share Information</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may share information with trusted service providers that help us operate WeLeap, such as account connection providers, hosting providers, analytics providers, customer support tools, SMS providers, and email delivery providers.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  For example, we may use Plaid to help connect financial accounts, Twilio to send SMS/text messages, and Postmark to send email communications.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  These service providers are only authorized to use your information as needed to provide services to WeLeap. We do not permit them to use your personal information for their own marketing purposes.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may also share information if required by law, to protect our rights, to prevent fraud or abuse, or with your consent.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Don't Do</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>We do not sell your personal information.</li>
                  <li>We do not access your financial accounts without your permission.</li>
                  <li>We do not sell your financial data.</li>
                  <li>We do not share your financial data with third parties for their own marketing purposes.</li>
                  <li>We do not sell, rent, share, or disclose your mobile phone number, SMS opt-in information, or text messaging consent to third parties or affiliates for marketing or promotional purposes.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Your Rights and Choices</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>You can view, update, or delete your data at any time. Account deletion is available directly in the app &mdash; see <strong>Deleting Your Account</strong> below.</li>
                  <li>You can opt out of marketing emails by using the unsubscribe link in our emails.</li>
                  <li>You can opt out of SMS messages by replying <strong>STOP</strong>.</li>
                  <li>You can choose not to connect financial accounts or disconnect connected accounts where supported.</li>
                  <li>You can update your communication preferences or request help by contacting us.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Deleting Your Account</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You can delete your WeLeap account at any time from inside the app, without contacting us. Go to <strong>Settings &rarr; Account &rarr; Delete Account</strong> and confirm. You do not need to email us, and we will not ask you to complete a further step to make the request effective.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Deleting your account does the following:
                </p>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>Immediately revokes any connections to your financial accounts, so WeLeap stops receiving data from them.</li>
                  <li>Removes your profile, financial information, goals, and plan history from our active systems.</li>
                  <li>Cancels any further email or SMS communications, other than a confirmation that the deletion took place.</li>
                </ul>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Deletion is permanent and cannot be undone. If you would prefer to disconnect your financial accounts but keep your WeLeap account, you can do that separately in the same settings area.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you cannot access the app for any reason, you can also request deletion by emailing{' '}
                  <a href="mailto:support@weleap.ai" className="text-primary-600 hover:underline">support@weleap.ai</a>{' '}
                  from the address associated with your account. This is an alternative route, not a requirement.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>How Long We Keep Your Information</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We keep personal information only for as long as we need it to provide the service, and then for the limited periods described below.
                </p>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li><strong>While your account is open:</strong> we retain your information for as long as your account remains active, so that WeLeap can keep producing your plan and recommendations.</li>
                  <li><strong>After you delete your account:</strong> we remove your personal information from our active systems within 30 days.</li>
                  <li><strong>Backups:</strong> residual copies may persist in encrypted backups for up to 90 days after deletion, after which they are overwritten on our normal backup cycle. We do not restore deleted accounts from backups.</li>
                  <li><strong>Financial account connections:</strong> access tokens for connected accounts are revoked immediately when you disconnect an account or delete your account.</li>
                  <li><strong>Records we are required to keep:</strong> we may retain limited records for longer where the law requires it, or to resolve disputes, prevent fraud and abuse, and enforce our agreements. Where we do this, we keep only what is necessary for that purpose.</li>
                  <li><strong>Opt-out records:</strong> if you unsubscribe from email or reply STOP to SMS, we keep a minimal record of that choice indefinitely. This is what allows us to honour your opt-out; deleting it would risk contacting you again.</li>
                  <li><strong>Anonymised and aggregated data:</strong> information that can no longer be linked to you or your device may be retained indefinitely and is not subject to the periods above.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Your California Privacy Rights</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you are a California resident, the California Consumer Privacy Act, as amended by the California Privacy Rights Act, gives you the rights set out below. We extend these rights to all California residents who use WeLeap.
                </p>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li><strong>Right to know:</strong> to request the categories and specific pieces of personal information we have collected about you, the sources, the purposes, and the categories of third parties we disclose it to.</li>
                  <li><strong>Right to delete:</strong> to request deletion of the personal information we hold about you, subject to the exceptions the law allows. You can also do this yourself at any time &mdash; see <strong>Deleting Your Account</strong> above.</li>
                  <li><strong>Right to correct:</strong> to request that we correct inaccurate personal information.</li>
                  <li><strong>Right to opt out of sale or sharing:</strong> we do not sell personal information. We do use advertising and analytics technologies that may count as &ldquo;sharing&rdquo; for cross-context behavioural advertising under California law, and you may opt out of that.</li>
                  <li><strong>Right to limit use of sensitive personal information:</strong> financial account information is treated as sensitive personal information under California law. We use it only to provide the service you asked for, and not to infer characteristics about you.</li>
                  <li><strong>Right to non-discrimination:</strong> we will not deny you service, charge you a different price, or give you a lower quality of service for exercising any of these rights.</li>
                </ul>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  <strong>Categories we collect.</strong> In the past 12 months we may have collected identifiers (such as name, email address and phone number), commercial and financial information (such as account balances and transactions, where you have connected an account), internet and network activity (such as how you interact with our site and app), and inferences drawn from that information to produce your plan and recommendations. The sources, purposes and recipients are described in the sections above.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  <strong>How to exercise these rights.</strong> Use the in-app controls where they exist, or email{' '}
                  <a href="mailto:support@weleap.ai" className="text-primary-600 hover:underline">support@weleap.ai</a>{' '}
                  with the subject line &ldquo;California Privacy Request&rdquo;. We will verify your request by confirming control of the email address on the account, and may ask for additional information if we cannot verify you from that alone. We will respond within 45 days, and will tell you if we need a further 45 days.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You may use an authorised agent to submit a request on your behalf. We may ask the agent for proof that you gave them permission, and may ask you to verify your identity with us directly.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Security</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We use reasonable administrative, technical, and organizational safeguards to protect your information. This includes encryption, secure infrastructure, access controls, and trusted third-party service providers.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  No system can be guaranteed to be 100% secure, but we work to protect your information and use security practices appropriate for the sensitivity of the data we handle.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Changes to This Policy</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may update this Privacy Policy from time to time. If we make material changes, we may notify you by email, in-app notice, or other appropriate means.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Contact Us</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you have questions about this Privacy Policy or your data, please contact us at:{' '}
                  <a href="mailto:support@weleap.ai" className="text-primary-600 hover:underline">support@weleap.ai</a>
                </p>
              </section>
            </div>
          </article>
        </Container>
      </Section>

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  )
}
