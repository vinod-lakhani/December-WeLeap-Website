import { Navigation } from "../../components/navigation"
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-36 pb-16 md:pt-40 md:pb-20 bg-[#386641] px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/85 text-sm">Effective Date: August 5, 2025</p>
        </div>
      </section>

      <main className="pt-10 pb-16 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <article className="prose prose-lg max-w-none">
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <p className="text-lg text-gray-700">
                Welcome to WeLeap! By using our services, you agree to these Terms of Service.
              </p>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">What We Provide</h2>
                <p>
                  WeLeap offers personalized financial insights, planning assistance, and product suggestions based on the
                  information you provide.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">Not Financial Advice</h2>
                <p>
                  We are not a registered investment advisor, broker, or tax professional. All insights are for
                  informational purposes only and should not be considered financial advice.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">User Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You agree to provide accurate information to get the best recommendations.</li>
                  <li>You're responsible for your own financial decisions.</li>
                  <li>You agree not to misuse the service or share misleading or harmful information.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">Data Use</h2>
                <p>
                  We handle your data according to our Privacy Policy. You retain ownership of your data, and we use it
                  only to serve you better.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">Service Changes</h2>
                <p>
                  We may modify or discontinue our services at any time. We'll notify you of significant changes.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
                <p>
                  WeLeap is not liable for any financial loss, missed opportunity, or decision made based on our
                  recommendations.
                </p>
              </section>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p className="mb-2 md:mb-0">© 2024 WeLeap.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
