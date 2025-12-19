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
                At WeLeap, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect
                your information when you use our services.
              </p>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Collect</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2 md:space-y-3", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>
                    <strong>Information you provide:</strong> name, email, financial goals, and basic demographic info.
                  </li>
                  <li>
                    <strong>Financial data (with your consent):</strong> transaction and account data via integrations like
                    Plaid.
                  </li>
                  <li>
                    <strong>Usage data:</strong> how you interact with the service, so we can improve the experience.
                  </li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>How We Use It</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>To generate personalized financial reports and recommendations.</li>
                  <li>To improve our models and services, in an anonymized and aggregated way.</li>
                  <li>To contact you with relevant updates or offers (you can opt out anytime).</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Don't Do</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>We do not sell your personal information.</li>
                  <li>We do not access your financial accounts without your permission.</li>
                  <li>We do not share your data with third parties without your explicit consent.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Your Rights</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>You can request to view, delete, or update your data at any time.</li>
                  <li>You can opt out of communications or data collection features.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Security</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We use bank-level encryption and secure servers to store and process your information.
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
              <p>© 2024 WeLeap.</p>
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
