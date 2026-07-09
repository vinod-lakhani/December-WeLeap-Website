import Link from "next/link"
import { ArrowLeft } from 'lucide-react'
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function TermsOfServicePage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-3 md:mb-4")}>Terms of Service</h1>
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
                Welcome to WeLeap. By using our services, website, waitlist, or related features, you agree to these Terms of Service. SMS messaging is optional and is governed by the SMS/Text Message Terms below. Using WeLeap or accepting these Terms does not opt you in to SMS.
              </p>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Provide</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap offers personalized financial insights, planning assistance, reminders, alerts, educational content, and product suggestions based on the information you provide and, where applicable, financial account data you choose to connect.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is designed to help users better understand their financial lives, including income, spending, savings, debt, and financial goals.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Not Financial Advice</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is not a registered investment advisor, broker-dealer, tax professional, law firm, or financial planner.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  All insights, reports, recommendations, projections, reminders, and product suggestions are provided for informational and educational purposes only. They should not be considered financial, investment, legal, tax, or professional advice.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You are responsible for your own financial decisions. You should consult a qualified professional before making major financial, investment, tax, legal, or borrowing decisions.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>User Responsibilities</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You agree to provide accurate, complete, and current information so WeLeap can provide more useful insights and recommendations.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You are responsible for reviewing any recommendations before acting on them.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You agree not to misuse the service, attempt to access another person's account, interfere with the operation of the service, submit misleading or harmful information, or use WeLeap for unlawful purposes.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Connected Accounts and Third-Party Services</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you choose to connect financial accounts through integrations such as Plaid, you authorize WeLeap and its service providers to access and process the connected account information needed to provide the service.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap may also use third-party service providers to operate the service, including providers for hosting, analytics, account connectivity, SMS delivery, email delivery, customer support, and security.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Your use of third-party services may also be subject to their own terms and privacy policies.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>SMS/Text Message Terms</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  SMS messages from WeLeap are optional. Agreeing to these Terms of Service does not opt you in to SMS, and you are never required to receive SMS messages to create an account, use WeLeap, or complete any transaction. You will only receive SMS messages if you separately and voluntarily opt in, either through the opt-in form at https://www.weleap.ai/sms-notifications or through an optional, unchecked SMS checkbox during onboarding. You may decline or skip SMS and continue to use all of WeLeap.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you choose to opt in by providing your mobile number and actively consenting, you agree that WeLeap may send you recurring text messages about your weekly financial summary, recommended actions (Leaps), and reminders related to your account.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Message frequency varies and is about 1 to 3 messages per week. Message and data rates may apply.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You may opt out at any time by replying <strong>STOP</strong> to any message from WeLeap. You may request help by replying <strong>HELP</strong>. After you reply STOP, we may send one final confirmation message; after that, we will stop sending SMS messages to your number unless you opt in again.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Consent to receive SMS messages is not a condition of purchasing or using WeLeap.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Mobile carriers are not liable for delayed or undelivered messages.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap uses Twilio and related service providers to deliver SMS messages. WeLeap does not sell, rent, share, or disclose your mobile phone number, SMS opt-in information, or text messaging consent to third parties or affiliates for their marketing or promotional purposes.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Email Communications</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  By providing your email address, you agree that WeLeap may send you emails related to your account, onboarding, product updates, financial sidekick notifications, waitlist updates, newsletters, marketing communications, and other relevant communications.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may use Postmark and related service providers to deliver and manage email communications.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You may unsubscribe from marketing emails by using the unsubscribe link included in those emails. We may still send transactional or service-related emails when necessary to operate the service, provide requested features, or communicate important updates.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Data Use</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We handle your data according to our{' '}
                  <Link href="/privacy-policy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You retain ownership of the information you provide. You authorize WeLeap to use your information to operate, personalize, secure, improve, and support the service.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may use anonymized and aggregated information to improve our models, recommendations, product experience, and services.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Product Suggestions and Third-Party Offers</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap may present financial product suggestions, partner offers, or educational recommendations based on your information.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Unless clearly stated otherwise, WeLeap does not guarantee that any third-party product, service, rate, approval, savings amount, investment outcome, or financial result will be available to you.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You are responsible for reviewing all third-party terms, fees, risks, and eligibility requirements before using any third-party product or service.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Service Changes</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may modify, suspend, or discontinue parts of the service at any time. We may also update features, reports, recommendations, pricing, or availability.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If we make significant changes, we may notify you through the website, email, SMS, in-app message, or another reasonable method.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Limitation of Liability</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  To the maximum extent permitted by law, WeLeap is not liable for financial loss, missed opportunity, lost profits, lost savings, investment loss, tax consequences, credit impact, borrowing outcomes, or any decision made based on WeLeap insights, recommendations, projections, reminders, or product suggestions.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap does not guarantee financial results.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>No Warranties</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is provided on an "as is" and "as available" basis. We do not guarantee that the service will be uninterrupted, error-free, perfectly accurate, or available at all times.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Financial data, account information, transaction data, projections, and recommendations may be incomplete, delayed, inaccurate, or affected by third-party provider issues.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Changes to These Terms</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may update these Terms from time to time. If we make material changes, we may notify you by email, SMS, website notice, in-app notice, or another reasonable method.
                </p>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Your continued use of WeLeap after updated Terms become effective means you accept the updated Terms.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Contact Us</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  If you have questions about these Terms, please contact us at:{' '}
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
