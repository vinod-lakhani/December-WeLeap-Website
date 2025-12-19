"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function ProductFeaturesPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium mb-6 md:mb-8 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            Built to help you take the next smart leap
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-4 md:mb-6")}>
            Product <span className="text-white">Features</span>
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-white/85 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed")}>
            See how WeLeap works — from planning your paycheck to making smarter decisions with one clear next step.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <EarlyAccessDialog signupType="product-features-hero">
              <Button className="bg-white text-primary-600 hover:bg-gray-100 px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
                Join Waitlist
              </Button>
            </EarlyAccessDialog>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl font-medium text-white hover:bg-white/10 transition-colors underline underline-offset-4"
            >
              See pricing <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
            </Link>
          </div>

          <p className={cn(TYPOGRAPHY.subtext, "text-white/80 mt-3 md:mt-4")}>No spam. Transparent from day one.</p>
        </Container>
      </Section>

      {/* In Action Section */}
      <Section variant="white" className="text-center">
        <Container>
          <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-3 md:mb-4")}>See WeLeap in Action</h2>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-8 md:mb-10 max-w-2xl mx-auto")}>
            This is what using WeLeap actually feels like.
          </p>

          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Builder-5ptuVPhvzsHIk24dTNnCjFb53aQwG6.mov"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto mx-auto bg-black"
              controls
            />
          </div>

          <div className="mt-6 md:mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-left">
            <Card className={cn(CARD_STYLES.base, "p-4 md:p-5")}>
              <CardContent className="p-0">
                <div className="flex items-start gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className={cn("font-semibold text-gray-900", TYPOGRAPHY.subtext)}>One clear next step</p>
                    <p className={cn("text-gray-600", TYPOGRAPHY.subtext)}>No clutter, no dashboards to decode.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(CARD_STYLES.base, "p-4 md:p-5")}>
              <CardContent className="p-0">
                <div className="flex items-start gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className={cn("font-semibold text-gray-900", TYPOGRAPHY.subtext)}>Adapts to real life</p>
                    <p className={cn("text-gray-600", TYPOGRAPHY.subtext)}>Plan changes when your life changes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(CARD_STYLES.base, "p-4 md:p-5 sm:col-span-2 md:col-span-1")}>
              <CardContent className="p-0">
                <div className="flex items-start gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className={cn("font-semibold text-gray-900", TYPOGRAPHY.subtext)}>Aligned incentives</p>
                    <p className={cn("text-gray-600", TYPOGRAPHY.subtext)}>We disclose how we make money — always.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Step 1 */}
      <Section variant="white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6">
                  What happens when you get paid
                </div>
                <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-4 md:mb-6")}>Dynamic Income Allocation</h2>
                <p className={cn(TYPOGRAPHY.body, "text-gray-700 mb-6 md:mb-8 leading-relaxed")}>
                  Congratulations on your bonus! Instead of just updating your balance, WeLeap recommends a smart
                  allocation — and with one tap, your money flows into the right categories.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Real-time spending analysis and recommendations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Goal-based planning with simple, trackable milestones</p>
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
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto bg-black"
                    controls
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Step 2 */}
      <Section variant="muted">
        <Container>
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
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto bg-black"
                    controls
                  />
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  What happens when life changes
                </div>
                <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-6")}>Adjusted to Your Life</h2>
                <p className={cn(TYPOGRAPHY.body, "text-gray-700 mb-8 leading-relaxed")}>
                  You get hit with a $600 car repair. Instead of scrambling, WeLeap adjusts your plan — boosting your
                  emergency fund, trimming variable spend, and keeping your goals on track.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Automatic adjustments based on your real cash flow</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Smarter tradeoffs so you stay on track without stress</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Card className={cn(CARD_STYLES.base, "bg-gray-50")}>
                <CardContent className="p-6 text-left">
                  <p className={cn("font-semibold text-gray-900 mb-2", TYPOGRAPHY.subtext)}>How it works (in plain English)</p>
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                    WeLeap watches your plan vs. reality. When something changes, it proposes a single clear move — a
                    smart Leap — and you stay in control with a quick approve.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Step 3 */}
      <Section variant="white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  Coming Soon: Smart Product Recommendations
                </div>
                <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-6")}>Smart Product Recommendations</h2>
                <p className={cn(TYPOGRAPHY.body, "text-gray-700 mb-8 leading-relaxed")}>
                  When you need a better product (a loan, card, or account), WeLeap recommends options based on fit —
                  not payouts — and explains why in plain language.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-amber-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Recommendations tailored to your profile and goals</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-amber-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Clear comparisons, tradeoffs, and what to do next</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-amber-600" />
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>We always disclose when we're paid</p>
                  </div>
                </div>

                <div className="mt-6 md:mt-8">
                  <Card className={cn("rounded-2xl border border-amber-200 bg-amber-50")}>
                    <CardContent className="p-4 md:p-6">
                      <p className={cn("font-semibold text-gray-900 mb-2", TYPOGRAPHY.subtext)}>Where fees go</p>
                      <p className={cn(TYPOGRAPHY.subtext, "md:text-base text-gray-700")}>
                        If WeLeap earns referral revenue, we disclose it — and a portion flows into the{" "}
                        <span className="font-semibold">WeLeap Community Fund</span> to support members and product
                        improvements. Recommendations are based on fit, not payouts.
                      </p>
                      <div className="mt-3 md:mt-4">
                        <Link href="/resources/community-fund-explained" className="inline-flex items-center text-primary-700 font-medium hover:underline text-sm md:text-base">
                          Learn about our community-first model <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-3 md:p-4 lg:p-6 shadow-2xl">
                  <video
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Recording%202025-08-15%20at%2011.29.42%20AM-SdjEpKsCDeoq6p1PtxzyYEMPeMug7O.mov"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto rounded-2xl shadow-lg mx-auto bg-black"
                    controls
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section variant="white" className="text-center">
        <Container>
          <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-4 md:mb-6")}>Ready to take your next smart leap?</h2>
          <p className={cn(TYPOGRAPHY.body, "text-gray-700 mb-8 md:mb-10 max-w-2xl mx-auto")}>
            Join the waitlist to get early access — and help shape the product with the community.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <EarlyAccessDialog signupType="product-features-cta">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
                Join Waitlist
              </Button>
            </EarlyAccessDialog>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium text-gray-900 hover:bg-black/5 transition-colors"
            >
              Why we built WeLeap <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Link>
          </div>

          <p className={cn(TYPOGRAPHY.subtext, "text-gray-500 mt-3 md:mt-4")}>
            No spam. Always transparent. Community-first from day one.
          </p>
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
