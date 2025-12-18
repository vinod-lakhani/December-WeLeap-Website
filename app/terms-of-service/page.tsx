import { Navigation } from "../../components/navigation"
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Effective Date: August 5, 2025</p>

        <article className="prose prose-lg max-w-none text-gray-700">
          <p>
            Welcome to WeLeap! By using our services, you agree to these Terms of Service.
          </p>

          <h3>What We Provide</h3>
          <p>
            WeLeap offers personalized financial insights, planning assistance, and product suggestions based on the
            information you provide.
          </p>

          <h3>Not Financial Advice</h3>
          <p>
            We are not a registered investment advisor, broker, or tax professional. All insights are for
            informational purposes only and should not be considered financial advice.
          </p>

          <h3>User Responsibilities</h3>
          <ul>
            <li>You agree to provide accurate information to get the best recommendations.</li>
            <li>You're responsible for your own financial decisions.</li>
            <li>You agree not to misuse the service or share misleading or harmful information.</li>
          </ul>

          <h3>Data Use</h3>
          <p>
            We handle your data according to our Privacy Policy. You retain ownership of your data, and we use it
            only to serve you better.
          </p>

          <h3>Service Changes</h3>
          <p>
            We may modify or discontinue our services at any time. We'll notify you of significant changes.
          </p>

          <h3>Limitation of Liability</h3>
          <p>
            WeLeap is not liable for any financial loss, missed opportunity, or decision made based on our
            recommendations.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p className="mb-2 md:mb-0">© 2024 WeLeap. Backed by Berkeley SkyDeck.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
