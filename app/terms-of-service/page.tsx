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
                Welcome to WeLeap! By using our services, you agree to these Terms of Service.
              </p>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What We Provide</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap offers personalized financial insights, planning assistance, and product suggestions based on the
                  information you provide.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Not Financial Advice</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We are not a registered investment advisor, broker, or tax professional. All insights are for
                  informational purposes only and should not be considered financial advice.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>User Responsibilities</h2>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>You agree to provide accurate information to get the best recommendations.</li>
                  <li>You're responsible for your own financial decisions.</li>
                  <li>You agree not to misuse the service or share misleading or harmful information.</li>
                </ul>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Data Use</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We handle your data according to our Privacy Policy. You retain ownership of your data, and we use it
                  only to serve you better.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Service Changes</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We may modify or discontinue our services at any time. We'll notify you of significant changes.
                </p>
              </section>

              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Limitation of Liability</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is not liable for any financial loss, missed opportunity, or decision made based on our
                  recommendations.
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
