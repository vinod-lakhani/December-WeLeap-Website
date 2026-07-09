import Link from "next/link"
import { ArrowLeft } from 'lucide-react'
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-3 md:mb-4")}>Privacy Policy</h1>
          <p className={cn(TYPOGRAPHY.subtext, "text-white/85")}>Effective Date: August 5, 2025</p>
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
                  <li>You can request to view, delete, or update your data at any time.</li>
                  <li>You can opt out of marketing emails by using the unsubscribe link in our emails.</li>
                  <li>You can opt out of SMS messages by replying <strong>STOP</strong>.</li>
                  <li>You can choose not to connect financial accounts or disconnect connected accounts where supported.</li>
                  <li>You can update your communication preferences or request help by contacting us.</li>
                </ul>
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
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p>© 2026 WeLeap.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </PageShell>
  )
}
