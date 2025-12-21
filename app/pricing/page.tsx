import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star } from "lucide-react"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function PricingPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <p className={cn(TYPOGRAPHY.body, "font-semibold text-white mb-2")}>
            🎉 Early Access is free. No credit card required.
          </p>
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 md:px-6 py-3 md:py-4 mb-4 md:mb-6 max-w-2xl mx-auto">
            <p className={cn(TYPOGRAPHY.body, "font-bold text-white text-center")}>
              Only 500 Founding Member spots available. Join now to lock in lifetime benefits.
            </p>
          </div>
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-3 md:mb-4 break-words")}>Pricing</h1>
          <p className={cn(TYPOGRAPHY.body, "text-white/85 max-w-2xl mx-auto text-balance break-words")}>
            We're keeping Phase 1 simple: one experience, free during early access. We'll introduce paid plans once the
            product is proven.
          </p>
        </Container>
      </Section>

      <Section variant="white">
        <Container>
          {/* Single Tier Card */}
          <div className="max-w-4xl mx-auto mb-10 md:mb-12">
            <Card className="border-primary/30 shadow-lg">
              <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
                <CardTitle className={cn(TYPOGRAPHY.h3, "text-gray-900")}>Early Access</CardTitle>
                <div className="mt-3 md:mt-4">
                  <span className="text-4xl md:text-5xl font-bold text-gray-900">$0</span>
                  <div className={cn(TYPOGRAPHY.subtext, "text-gray-600 mt-2")}>Free during the early access period</div>
                </div>
              </CardHeader>

              <CardContent className="px-4 md:px-6">
                <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                  {/* What everyone gets right now */}
                  <div>
                    <h3 className={cn("text-lg font-semibold text-gray-900 mb-4")}>What everyone gets right now</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Dashboard + insights</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Automation & alerts</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Track spending, income, and savings</span>
                      </li>
                    </ul>
                  </div>

                  {/* What the First 500 get forever */}
                  <div>
                    <h3 className={cn("text-lg font-semibold text-gray-900 mb-4")}>What the First 500 get forever</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Recognition as a founding supporter</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Priority support</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Locked-in pricing (lowest rate for life)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>Vote on how the Community Fund is used (e.g., which charities we support or which member rewards we prioritize)</span>
                      </li>
                    </ul>

                    <div className="bg-primary/5 rounded-lg p-4 mt-6 w-full">
                      <p className={cn(TYPOGRAPHY.subtext, "text-gray-900 font-medium mb-1")}>What happens after early access?</p>
                      <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                        We'll introduce paid plans only after we've earned it. Founding Members will keep access to
                        founding perks and lock in our lowest possible rate for life once paid plans launch.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <EarlyAccessDialog signupType="pricing">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-xl transition-all duration-200">
                      Join the Waitlist
                    </Button>
                  </EarlyAccessDialog>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto py-3 px-8 rounded-xl"
                    asChild
                  >
                    <Link href="/resources/pricing-philosophy">Read our pricing philosophy</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Fund Section */}
          <div className="max-w-4xl mx-auto mb-12 md:mb-14">
            <Card className="border-primary/10 rounded-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-4")}>Community Fund</CardTitle>
                <p className={cn(TYPOGRAPHY.body, "text-gray-700 max-w-3xl mx-auto text-balance")}>
                  WeLeap is built to fight misaligned incentives. When WeLeap earns referral or transaction revenue, we
                  disclose it — and we route it into the <span className="font-semibold">WeLeap Community Fund</span> so
                  the upside goes back to the community, not Wall Street.
                </p>
              </CardHeader>

              <CardContent>
                {/* Simple 3-up summary */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                    <div className={cn("font-semibold text-gray-900 mb-1", TYPOGRAPHY.subtext)}>Transparent by default</div>
                    <div className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                      If we're paid, you'll see it — always.
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                    <div className={cn("font-semibold text-gray-900 mb-1", TYPOGRAPHY.subtext)}>Fees flow to the Fund</div>
                    <div className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                      Referral/transaction revenue is routed into the Community Fund.
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                    <div className={cn("font-semibold text-gray-900 mb-1", TYPOGRAPHY.subtext)}>Governed by members</div>
                    <div className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                      Founding Members vote on how the Fund is used (e.g., which charities we support or which member rewards we prioritize).
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                    Explore how the Community Fund works →{" "}
                    <Link
                      href="/resources/community-fund-explained"
                      className="text-primary hover:text-primary/80 underline font-medium"
                    >
                      What the WeLeap Community Fund Means for You
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto">
            <h2 className={cn(TYPOGRAPHY.h2, "text-center text-gray-900 mb-12")}>Frequently Asked Questions</h2>

            <div className="space-y-6">
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <h3 className={cn("text-lg font-semibold text-gray-900 mb-2")}>Do you have multiple plans?</h3>
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                  In Phase 1, no — everyone gets the same Early Access experience for free. Once we've proven value,
                  we'll introduce paid plans (and Founding Members will get founder perks and best-available pricing).
                </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <h3 className={cn("text-lg font-semibold text-gray-900 mb-2")}>Who is a Founding Member?</h3>
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                  The first 500 signups are automatically recognized as Founding Members. No extra step, no separate
                  checkout — it's a thank-you for helping us build.
                </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="p-6">
                <h3 className={cn("text-lg font-semibold text-gray-900 mb-2")}>How do you make money?</h3>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                  Currently, we don't. We are venture-backed and focused on growth. In the future, we will introduce fair subscription fees and transparent referral models. When we're paid, we disclose it — and we route that revenue
                  into the WeLeap Community Fund so the upside benefits the community.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <h3 className={cn("text-lg font-semibold text-gray-900 mb-2")}>Is my financial data secure?</h3>
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                    Your data is encrypted with bank-level security. We use read-only connections to your accounts and
                    never store your banking credentials.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <h3 className={cn("text-lg font-semibold text-gray-900 mb-2")}>What if WeLeap doesn't work for me?</h3>
                  <p className={cn(TYPOGRAPHY.subtext, "text-gray-600")}>
                  Early Access is free — you can try it without risk. As we launch paid plans later, we'll include a
                  clear guarantee policy.
                </p>
                </CardContent>
              </Card>
            </div>
          </div>
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
