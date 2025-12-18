"use client"

import { useEffect } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"

export default function ProductFeaturesPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
            Product <span className="text-primary-600">Features</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover the powerful features that make WeLeap the smartest choice for your financial future. Built with
            cutting-edge AI and designed for real-world financial challenges.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">See WeLeap in Action</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Watch how WeLeap's intelligent financial assistant transforms the way you manage your money.
            </p>
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Builder-5ptuVPhvzsHIk24dTNnCjFb53aQwG6.mov"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto mx-auto"
              controls
            />
          </div>
        </div>
      </section>

      {/* Prototype 1 - Dynamic Income Allocation */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  Feature 1
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Dynamic Income Allocation</h2>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Congratulations on your bonus! Most tools just update your balance but with the help of Ribbit from
                  WeLeap, you will be recommended a smart allocation. With one tap, your funds are allocated to the
                  right spending categories.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Real-time spending analysis and recommendations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Goal-based financial planning with milestone tracking</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-2xl">
                  <video
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dynamic%20income%20allocation-cTR3ZfJlQr5TLa8Y7n23rKYcMgeCAT.mov"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto"
                    controls
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prototype 2 - Smart Budget Automation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-2xl">
                  <video
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/adjusted%20to%20your%20life-TymYtIr2xNaGpMMC4x6UUhguGBiIfM.mov"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto"
                    controls
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  Feature 2
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Adjusted to Your Life</h2>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  You're notified of a $600 car repair and instead of scrambling, Ribbit adjusts your plan. By boosting
                  your Emergency Fund, trimming your Variable Spending, and slightly reducing your Investments, your
                  financial goals stay on track.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Automatic savings allocation based on income patterns</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Dynamic budget adjustments for unexpected expenses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prototype 3 - Investment Discovery */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  Feature 3
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Smart Product Recommendations</h2>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Stop guessing about investments. Our AI analyzes thousands of financial products, market conditions,
                  and your personal profile to recommend the perfect investment opportunities that match your risk
                  tolerance and goals.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Personalized investment recommendations with risk analysis</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Real-time market insights and portfolio optimization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">Automated rebalancing based on portfolio optimization</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl">
                  <video
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Recording%202025-08-15%20at%2011.29.42%20AM-SdjEpKsCDeoq6p1PtxzyYEMPeMug7O.mov"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto"
                    controls
                  />
                </div>
              </div>
            </div>
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
