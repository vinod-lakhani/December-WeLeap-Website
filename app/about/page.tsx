import { Navigation } from "@/components/navigation"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 text-center">
            About <span className="text-primary-600">WeLeap</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl text-center">
            We're building the future of personal finance through AI-powered guidance that adapts to your unique
            financial journey.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6 text-center">Our Mission</h2>

            <p className="text-xl text-primary-600 font-semibold mt-6 leading-relaxed text-center">
              Giving young adults an AI sidekick that turns money stress into lasting financial freedom.
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Founders Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-16">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-green-600 font-semibold text-lg tracking-wide">MEET THE FOUNDERS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">Built for Gen Z — by Parents Who Get It</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Vinod Lakhani */}
            <div className="flex flex-col">
              <div className="flex items-start mb-6">
                <div className="w-24 h-24 mr-6 flex-shrink-0">
                  <img
                    src="/images/vinod-lakhani.png"
                    alt="Vinod Lakhani"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-1">Vinod Lakhani</h3>
                  <p className="text-green-600 font-semibold mb-2">Co-founder & CEO</p>
                  <p className="text-gray-600 text-sm">
                    Father of three daughters — in early career, college, and high school
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-gray-700">• Scaled a business from $50M to $300M+, exited SCUTI AI</p>
                <p className="text-gray-700">• Former exec at Broadcom, Inphi, Bright Machines</p>
                <p className="text-gray-700">
                  • Mission: use AI to level the financial playing field for the next generation
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg">
                <p className="text-gray-700 italic">
                  "I've helped scale massive businesses — now I'm building something that helps my daughters, and yours,
                  thrive."
                </p>
              </div>
            </div>

            {/* Maurizio Greco */}
            <div className="flex flex-col">
              <div className="flex items-start mb-6">
                <div className="w-24 h-24 mr-6 flex-shrink-0">
                  <img
                    src="/images/maurizio-greco.png"
                    alt="Maurizio Greco"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-1">Maurizio Greco</h3>
                  <p className="text-green-600 font-semibold mb-2">Co-founder & CTO</p>
                  <p className="text-gray-600 text-sm">Father of two — in college and middle school</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-gray-700">• Deep tech architect for HSBC, Standard Chartered, and Bank of China</p>
                <p className="text-gray-700">• Co-founded Chronicled (blockchain infra for pharma)</p>
                <p className="text-gray-700">• Expert in cryptography, zero-knowledge proofs, and AI systems</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg">
                <p className="text-gray-700 italic">
                  "I've spent my career building tech for banks. Now I'm building for people."
                </p>
              </div>
            </div>
          </div>

          {/* Personal Motivation Text */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-2xl border border-green-100">
              <p className="text-lg text-gray-700 leading-relaxed text-left">
                <strong>
                  We didn't start WeLeap because we saw a market. We started it because our kids needed it.
                </strong>{" "}
                As fathers of Gen Z daughters, we have seen first-hand the challenges faced by the next generation in
                managing their finances. That realization sparked the understanding: most young adults feel the same
                way—excited but overwhelmed, ambitious but underserved by a system built around profits, not people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-16">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-red-600 font-semibold text-lg tracking-wide">THE PROBLEM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">The Financial System Isn't Built for You</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Left Column - Statistics */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-red-600 mb-2">70%</div>
                <p className="text-gray-700">of young adults report mental stress due to finances</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-red-600 mb-2">48%</div>
                <p className="text-gray-700">learn finances from social media</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-red-600 mb-2">54%</div>
                <p className="text-gray-700">live paycheck to paycheck despite working full-time</p>
              </div>
            </div>

            {/* Right Column - The Reality */}
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-bold text-black mb-3">The Reality Check</h3>
                <div className="space-y-4 text-gray-700">
                  <p>• Traditional financial advice assumes you have money to invest</p>
                  <p>• Banks profit from your overdrafts and credit card debt</p>
                  <p>• "Financial advisors" only care if you have $100K+ to manage</p>
                  <p>• Apps gamify spending but don't teach real financial skills</p>
                  <p>• Your parents' money advice doesn't work in today's economy</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
                <p className="text-lg text-gray-700 leading-relaxed">
                  <strong>The system is rigged against you.</strong> While Wall Street gets richer, young adults are
                  left to figure out money management on their own — with outdated tools, predatory products, and advice
                  that doesn't match their reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Fund Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left mb-16">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
              <span className="text-blue-600 font-semibold text-lg tracking-wide">COMMUNITY FUND</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">The Fund That Works for You</h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl whitespace-nowrap">
              Your fees don't go to Wall Street. They go back into the WeLeap Community — and you decide how they're
              used.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* How It Works Section */}
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-2xl font-bold text-black mb-3">How the Community Fund Works</h3>
                <div className="space-y-4 text-gray-700">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Free →</strong> transaction fees sustain the platform
                      </p>
                      <p>
                        <strong>Plus →</strong> transaction fees go directly into the Community Fund
                      </p>
                      <p>
                        <strong>Subscription fees</strong> fund WeLeap operations
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-blue-200 mb-6">
                    <div className="flex flex-col space-y-4">
                      {/* Step 1 */}
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">Plus user activity generates fees</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">Fees flow into the Fund</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">Community votes on allocation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p>• Every Plus member contributes to a shared community fund</p>
                  <p>• Funds are allocated to members who need financial support</p>
                  <p>• AI-powered matching ensures fair and transparent distribution</p>
                  <p>• Members vote on fund allocation and community guidelines</p>
                  <p>• Success stories inspire and guide future fund decisions</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-100">
                <p className="text-lg text-gray-700 leading-relaxed">
                  <strong>It's not charity — it's community.</strong> When members succeed, everyone benefits. The fund
                  creates a safety net that traditional finance never provided for young adults.
                </p>
              </div>

              <div className="mt-6">
                <Link href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center group">
                  Read the full story → What the WeLeap Community Fund Means for You
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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

            {/* Buckets of Use Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-black mb-8 text-center">How Your Community Fund Gets Used</h3>

              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                {/* New Feature Development */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">New Feature Development</h4>
                  <p className="text-sm text-gray-600">Funding product improvements</p>
                </div>

                {/* Dividends/Rewards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
                        clipRule="evenodd"
                      />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Dividends/Rewards</h4>
                  <p className="text-sm text-gray-600">Sharing value back with users</p>
                </div>

                {/* Financial Literacy Grants */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Financial Literacy Grants</h4>
                  <p className="text-sm text-gray-600">Supporting education</p>
                </div>

                {/* Emergency Debt Relief */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Emergency Debt Relief</h4>
                  <p className="text-sm text-gray-600">Helping those in crisis</p>
                </div>

                {/* Community Events */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      <path d="M6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Community Events</h4>
                  <p className="text-sm text-gray-600">Building shared experiences</p>
                </div>
              </div>

              <div className="text-center">
                <Link href="#" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center group">
                  See how referrals fuel your credits → Referrals Reimagined: Earn More Than Just Perks
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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

            {/* Governance & Credits Section */}
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-2xl font-bold text-black mb-3">Governance & Credits</h3>
                <p className="text-gray-700 mb-6">
                  Earn 9 credits to unlock voting rights. More credits = more influence in how the Fund is used.
                </p>
              </div>

              {/* Credit Ladder */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Credit Ladder</h4>
                <div className="space-y-3">
                  {/* 9 Credits - Governance */}
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          9
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Governance Unlock</p>
                          <p className="text-sm text-gray-600">Vote on fund allocation</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* 6 Credits */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          6
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Premium Features</p>
                          <p className="text-sm text-gray-600">Advanced AI insights</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Credits */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Priority Support</p>
                          <p className="text-sm text-gray-600">Faster response times</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1 Credit */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Basic Access</p>
                          <p className="text-sm text-gray-600">Core features unlocked</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Your voice matters.</strong> The more you engage with WeLeap and help grow the community, the
                  more influence you have in shaping how the Community Fund supports members.
                </p>
              </div>
            </div>

            {/* Transparency Commitment Section */}
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-2xl font-bold text-black mb-3">Transparency Commitment</h3>
                <p className="text-gray-700 mb-6">
                  We'll publish the fund size, usage breakdown, and community votes regularly — so you always know where
                  your money is going.
                </p>
              </div>

              {/* Transparency Dashboard Mockup */}
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Live Transparency Dashboard</h4>

                {/* Fund Size */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Fund Size</span>
                    <span className="text-2xl font-bold text-blue-600">$127,450</span>
                  </div>
                </div>

                {/* Allocation by Bucket */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Allocation by Bucket</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">New Features</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "35%" }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">35%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dividends</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">25%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Education</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: "20%" }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">20%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Emergency Relief</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">15%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Events</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: "5%" }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Vote Results */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Last Community Vote</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Topic:</strong> Increase Emergency Relief allocation
                    </p>
                    <p>
                      <strong>Result:</strong> Approved (78% in favor)
                    </p>
                    <p>
                      <strong>Voters:</strong> 1,247 members
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Fund FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Community Fund FAQ</h2>
            <p className="text-lg text-gray-600">Everything you need to know about how the fund works</p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-3">Q: What is the WeLeap Community Fund?</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>A:</strong> It's a fund powered by Plus users' transaction fees. 100% of those fees go into the
                Fund, and users decide how it's spent.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-3">Q: Who controls the Fund?</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>A:</strong> Plus subscribers with 9 or more credits gain governance rights to vote on Fund
                allocation. The more credits you have, the more say you get.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-3">Q: What can the Fund be used for?</h3>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-2">
                  <strong>A:</strong> Categories include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>New feature development</li>
                  <li>Dividends & rewards back to users</li>
                  <li>Financial literacy grants</li>
                  <li>Emergency debt relief micro-grants</li>
                  <li>Community events</li>
                </ul>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-3">Q: How do I track what's happening with the Fund?</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>A:</strong> WeLeap will publish transparent reports and dashboards showing Fund inflows and how
                allocations are decided by the community.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-3">Q: Why did you design it this way?</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>A:</strong> Most finance apps profit from steering users into products. WeLeap flipped the
                model: your fees don't go to banks or shareholders — they go back to your community, with you deciding
                how they're used.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Financial Future?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of early users who are already experiencing the power of AI-driven financial guidance.
          </p>
          <button className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg">
            Join the Waitlist
          </button>
        </div>
      </section>

      {/* Backed by Section */}
      <section className="py-8 px-4 border-t border-gray-200" style={{ backgroundColor: "#f3f4f6" }}>
        <div className="container mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm" style={{ color: "#111827" }}>
            Backed by
          </p>
          <div className="flex justify-center items-center">
            <span className="text-xl font-bold" style={{ color: "#1f2937" }}>
              Berkeley SkyDeck
            </span>
          </div>
        </div>
      </section>

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
