import { Navigation } from "@/components/navigation"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-36 pb-16 md:pt-40 md:pb-20 bg-[#386641] px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            About <span className="text-white">WeLeap</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/85 leading-relaxed max-w-3xl mx-auto px-4">
            We're building the future of personal finance through AI-powered guidance that adapts to your unique
            financial journey.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4 px-4">Our Mission</h2>
            <p className="text-lg sm:text-xl text-primary-600 font-semibold leading-relaxed max-w-3xl mx-auto px-4">
              Giving young adults an AI sidekick that turns money stress into lasting financial freedom.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-10 sm:mb-12">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-green-600 font-semibold text-base sm:text-lg tracking-wide">LEADERSHIP</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">Built for Gen Z — by Parents Who Get It</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Vinod Lakhani */}
            <div className="flex flex-col">
              <div className="flex flex-col sm:flex-row items-start mb-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/vinod-lakhani.png"
                    alt="Vinod Lakhani"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-1">Vinod Lakhani</h3>
                  <p className="text-green-600 font-semibold mb-2">Co-founder & CEO</p>
                  <p className="text-gray-600 text-sm">
                    Father of three daughters — in early career, college, and high school
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-gray-700">• Scaled a business from $50M to $300M+, exited SCUTI AI</p>
                <p className="text-gray-700">• Former exec at Broadcom, Inphi, Bright Machines</p>
                <p className="text-gray-700">
                  • Mission: use AI to level the financial playing field for the next generation
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg mb-6">
                <p className="text-gray-700 italic">
                  "I've helped scale massive businesses — now I'm building something that helps my daughters, and yours,
                  thrive."
                </p>
              </div>
            </div>

            {/* Personal Motivation Text - Condensed */}
            <div className="mt-10 sm:mt-12 max-w-4xl mx-auto px-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 sm:p-6 rounded-2xl border border-green-100">
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  <strong>
                    We didn't start WeLeap because we saw a market. We started it because our kids needed it.
                  </strong>{" "}
                  As a father of Gen Z daughters, I've seen first-hand the challenges young adults face managing their finances. 
                  Most feel the same way—excited but overwhelmed, ambitious but underserved by a system built around profits, not people.
                </p>
              </div>
            </div>

            {/* Shubhashree Venkatesh */}
            <div className="flex flex-col mt-10">
              <div className="flex flex-col sm:flex-row items-start mb-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/shubha.jpeg"
                    alt="Shubhashree Venkatesh"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load Shubha image:", e);
                      // Fallback to a placeholder or try alternative path
                    }}
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-1">Shubhashree Venkatesh</h3>
                  <p className="text-green-600 font-semibold mb-2">Head of Engineering</p>
                  <p className="text-gray-600 text-sm">
                    Mother of two - in early career and college
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-gray-700">• Built and scaled high-performance global engineering teams, delivering complex systems with strong culture, retention, and execution discipline</p>
                <p className="text-gray-700">• Deep expertise in cloud-native and distributed systems, architecting resilient platforms with up to 99.999% availability across multiple domains</p>
                <p className="text-gray-700">
                  • Proven execution leader, partnering closely with Product and cross-functional teams to ship critical initiatives under tight timelines
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg mb-6">
                <p className="text-gray-700 italic">
                  "I've spent my career building systems that must work at scale. At WeLeap, we're building systems people can trust with their financial future."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advisors Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-10 sm:mb-12">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-blue-600 font-semibold text-base sm:text-lg tracking-wide">ADVISORS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-3">Trusted Advisors</h2>
            <p className="text-base sm:text-lg text-gray-600">
              Experts who helped shape WeLeap early and continue to guide our vision.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Maurizio Greco - Simplified */}
            <div className="flex flex-col">
              <div className="flex flex-col sm:flex-row items-start mb-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/maurizio-greco.png"
                    alt="Maurizio Greco"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-1">Maurizio Greco</h3>
                  <p className="text-blue-600 font-semibold mb-2">Trusted Advisor (formerly Co-Founder)</p>
                  <p className="text-gray-600 text-sm">Father of two — in college and middle school</p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-gray-700">• Deep tech architect for HSBC, Standard Chartered, and Bank of China</p>
                <p className="text-gray-700">• Co-founded Chronicled (blockchain infrastructure for pharma)</p>
                <p className="text-gray-700">• Provides strategic guidance on technical architecture and product vision</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                <p className="text-gray-700 italic">
                  "I've spent my career building tech for banks. Now I'm building for people."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Transition line connecting to founders' motivation */}
          <div className="text-center mb-8 max-w-3xl mx-auto px-4">
            <p className="text-base sm:text-lg text-gray-600 italic">
              These principles guide everything we build, rooted in our mission to serve the next generation.
            </p>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">What We Believe</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
            {/* Action over dashboards */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3 text-center">Action over dashboards</h3>
              <p className="text-sm sm:text-base text-gray-700 text-center flex-grow">
                We give you one clear next step, not endless charts to interpret.
              </p>
            </div>

            {/* Clarity over clutter */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3 text-center">Clarity over clutter</h3>
              <p className="text-sm sm:text-base text-gray-700 text-center flex-grow">
                Your Sidekick cuts through the noise and focuses on what matters.
              </p>
            </div>

            {/* Aligned incentives */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3 text-center">Aligned incentives</h3>
              <p className="text-sm sm:text-base text-gray-700 text-center flex-grow">
                No hidden kickbacks. We show how we make money, always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Community-First Model Section - Simplified */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">Our Community-First Model</h2>
            
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              WeLeap operates on a community-first model where member fees and revenue flow into a shared Community Fund. 
              This fund supports members during financial challenges, enables product improvements, and creates a sustainable 
              cycle where success is shared, not extracted.
            </p>

            {/* Value-forward transparency note - Prominent */}
            <div className="bg-green-50 border-l-4 border-primary-500 pl-5 sm:pl-6 pr-5 sm:pr-6 py-5 sm:py-6 rounded-r-lg mb-6">
              <p className="text-base sm:text-lg text-gray-800 leading-relaxed">
                <strong className="text-primary-700">Transparency & Alignment:</strong> When WeLeap earns referral revenue or transaction fees, 
                we disclose it—and a portion flows into the <strong>WeLeap Community Fund</strong>. This ensures our recommendations 
                are based on what's best for you, not what pays us most. Your success and our success are aligned.
              </p>
            </div>

            {/* Learn more link */}
            <Link 
              href="/how-it-works" 
              className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center group text-base"
            >
              Learn more about our model
              <svg
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#386641]">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4">Ready to Transform Your Financial Future?</h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl mx-auto px-4">
            Join thousands of early users who are already experiencing the power of AI-driven financial guidance.
          </p>
          <EarlyAccessDialog signupType="cta">
            <Button className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg">
              Join the Waitlist
            </Button>
          </EarlyAccessDialog>
        </div>
      </section>

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
