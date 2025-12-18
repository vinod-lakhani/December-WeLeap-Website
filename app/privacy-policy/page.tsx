import { Navigation } from "../../components/navigation"
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Effective Date: August 5, 2025</p>

        <article className="prose prose-lg max-w-none text-gray-700">
          <p>
            At WeLeap, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect
            your information when you use our services.
          </p>

          <h3>What We Collect</h3>
          <ul>
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

          <h3>How We Use It</h3>
          <ul>
            <li>To generate personalized financial reports and recommendations.</li>
            <li>To improve our models and services, in an anonymized and aggregated way.</li>
            <li>To contact you with relevant updates or offers (you can opt out anytime).</li>
          </ul>

          <h3>What We Don't Do</h3>
          <ul>
            <li>We do not sell your personal information.</li>
            <li>We do not access your financial accounts without your permission.</li>
            <li>We do not share your data with third parties without your explicit consent.</li>
          </ul>

          <h3>Your Rights</h3>
          <ul>
            <li>You can request to view, delete, or update your data at any time.</li>
            <li>You can opt out of communications or data collection features.</li>
          </ul>

          <h3>Security</h3>
          <p>
            We use bank-level encryption and secure servers to store and process your information.
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
