import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star } from "lucide-react"
import { EarlyAccessDialog } from "@/components/early-access-dialog"

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      description: "Perfect for getting started with smart money management",
      features: [
        "Basic income allocation",
        "Expense tracking",
        "Monthly financial insights",
        "Email support",
        "Mobile app access",
      ],
      popular: false,
    },
    {
      name: "Builder",
      price: "$19",
      description: "For ambitious individuals ready to accelerate their wealth building",
      features: [
        "Everything in Starter",
        "Advanced Plan → Act → Adapt system",
        "Automated savings optimization",
        "Investment recommendations",
        "Priority support",
        "Custom financial goals",
        "Weekly progress reports",
      ],
      popular: true,
    },
    {
      name: "Wealth",
      price: "$39",
      description: "Complete financial command center for serious wealth builders",
      features: [
        "Everything in Builder",
        "Personal financial advisor access",
        "Tax optimization strategies",
        "Portfolio management tools",
        "Real estate investment tracking",
        "Business expense management",
        "24/7 premium support",
        "Custom integrations",
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Early Adopter Celebration Banner */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 overflow-hidden mt-24">
        {/* Confetti decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-2 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
          <div
            className="absolute top-6 left-20 w-2 h-2 bg-pink-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute top-4 right-16 w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-8 right-32 w-2 h-2 bg-green-400 rounded-full animate-bounce"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute top-3 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.8s" }}
          ></div>
          <div
            className="absolute top-7 right-1/3 w-3 h-3 bg-orange-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          ></div>
        </div>

        {/* Ribbon decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-pink-400 via-blue-400 via-green-400 to-purple-400"></div>

        <div className="container mx-auto px-6 py-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg md:text-xl font-semibold text-foreground mb-2">
              🎉 Welcome Early Adopters! You get Plus features FREE during your initial access period. No credit card
              required.
            </p>
            <p className="text-sm md:text-base text-muted-foreground">
              Founding Members enjoy the full Plus experience at no cost. Thank you for helping us build WeLeap.
            </p>
          </div>
        </div>
      </div>

      <main className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          {/* Pricing Cards */}

          {/* Plan Comparison Table Section */}
          <div className="bg-card rounded-2xl p-8 md:p-12 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Compare Plans</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                Choose the plan that fits your financial journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free (Core) Plan */}
              <Card className="border-border">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-foreground">Free (Core)</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">$0</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Dashboard + insights</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Track spending, income, and savings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Transaction fees fund the platform</span>
                    </li>
                  </ul>
                  <EarlyAccessDialog>
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-foreground font-medium py-3 rounded-xl transition-all duration-200">
                      Get Started Free
                    </Button>
                  </EarlyAccessDialog>
                </CardContent>
              </Card>

              {/* Plus (Community-Powered) Plan */}
              <Card className="border-primary shadow-lg relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Founding Perk
                </Badge>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-foreground">Plus (Community-Powered)</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground line-through text-muted-foreground">$9.99</span>
                    <span className="text-4xl font-bold text-primary ml-2">FREE</span>
                    <div className="text-sm text-muted-foreground mt-1">for Early Adopters</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Full automation & alerts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Concierge Q&A + Marketplace perks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">
                        Voting rights in the Community Fund
                        <Badge className="ml-2 bg-primary/10 text-primary text-xs">Exclusive</Badge>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">100% of transaction fees redirected to the Fund</span>
                    </li>
                  </ul>

                  <div className="bg-primary/5 rounded-lg p-4 mb-6">
                    <p className="text-sm text-foreground font-medium mb-1">Early Access Benefit:</p>
                    <p className="text-sm text-muted-foreground">
                      Your early access includes all Plus features at no cost. Founding Members lock in $4.99/month
                      after the free period.
                    </p>
                  </div>

                  <EarlyAccessDialog>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all duration-200">
                      Get Plus FREE
                    </Button>
                  </EarlyAccessDialog>
                </CardContent>
              </Card>
            </div>

            {/* Blog Reference */}
            <div className="text-center mt-8">
              <p className="text-muted-foreground">
                Read more about how we designed pricing to work for you →{" "}
                <a
                  href="/resources/pricing-philosophy"
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  How We Built Pricing That Works for You, Not the System
                </a>
              </p>
            </div>
          </div>

          {/* Referral & Credits Section */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 mb-16 border border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Extend Your Free Access</h2>
              <p className="text-xl text-foreground font-semibold mb-2">
                Want to extend your free period? Every referral = 3 credits = 1 free month of Plus. At 9 credits, you
                unlock governance.
              </p>
              <p className="text-muted-foreground">
                Your referrals extend your free Plus access — thank you for helping us grow!
              </p>
            </div>

            {/* Credit Ladder Visual */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-foreground text-center mb-6">Credit Ladder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-4 border border-primary/20 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">3 Credits</div>
                  <div className="text-sm text-muted-foreground">→</div>
                  <div className="text-foreground font-medium">1 free month of Plus</div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-primary/30 text-center shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-2">9 Credits</div>
                  <div className="text-sm text-muted-foreground">→</div>
                  <div className="text-foreground font-medium">Governance unlock</div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-primary/20 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">15 Credits</div>
                  <div className="text-sm text-muted-foreground">→</div>
                  <div className="text-foreground font-medium">Champion perks (early features)</div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-primary/20 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">30 Credits</div>
                  <div className="text-sm text-muted-foreground">→</div>
                  <div className="text-foreground font-medium">Ambassador perks</div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/40 text-center shadow-md md:col-span-2 lg:col-span-2">
                  <div className="text-2xl font-bold text-primary mb-2">75+ Credits</div>
                  <div className="text-sm text-muted-foreground">→</div>
                  <div className="text-foreground font-medium text-lg">🎉 Lifetime Plus</div>
                </div>
              </div>
            </div>

            {/* Blog Reference */}
            <div className="text-center mt-8">
              <p className="text-muted-foreground">
                Learn why our referral program is different →{" "}
                <a
                  href="/resources/referrals-reimagined"
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  Referrals Reimagined: Earn More Than Just Perks
                </a>
              </p>
            </div>
          </div>

          {/* Community Fund Section */}
          <div className="bg-card rounded-2xl p-8 md:p-12 mb-16 border border-primary/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Community Fund Impact</h2>
              <p className="text-lg text-foreground max-w-4xl mx-auto text-balance">
                When you choose Plus, your subscription funds WeLeap, but 100% of your transaction fees go directly into
                the Community Fund. That means you help decide where the money goes — not banks or Wall Street.
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Your Actions</h3>
                  <p className="text-sm text-muted-foreground">Daily transactions</p>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-primary rotate-90 md:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Transaction Fees</h3>
                  <p className="text-sm text-muted-foreground">100% redirected</p>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-primary rotate-90 md:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Community Fund</h3>
                  <p className="text-sm text-muted-foreground">Democratic control</p>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-primary rotate-90 md:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.356-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Community Impact</h3>
                  <p className="text-sm text-muted-foreground">Real change</p>
                </div>
              </div>
            </div>

            {/* Blog Reference */}
            <div className="text-center">
              <p className="text-muted-foreground">
                Explore how the Community Fund works →{" "}
                <a
                  href="/resources/community-fund-explained"
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  What the WeLeap Community Fund Means for You
                </a>
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 md:p-12 mb-16 border border-primary/20 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Transform Your Financial Future?</h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <EarlyAccessDialog>
                <Button className="bg-secondary hover:bg-secondary/90 text-foreground font-medium py-3 px-8 rounded-xl transition-all duration-200 text-lg">
                  Join Free
                </Button>
              </EarlyAccessDialog>

              <EarlyAccessDialog>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-xl transition-all duration-200 text-lg">
                  Upgrade to Plus
                </Button>
              </EarlyAccessDialog>
            </div>

            <p className="text-muted-foreground text-lg">
              Founding Member pricing available now — lock in $4.99/month after your free period.
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 mb-16 border border-primary/20 text-center">
            <p className="text-lg md:text-xl text-foreground max-w-4xl mx-auto text-balance">
              Thank you for being one of the first to leap with us. Your early support means you get the full Plus
              experience free during this launch period — and the chance to extend it with referrals.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">What plans does WeLeap offer?</h3>
                <p className="text-muted-foreground mb-3">
                  We offer two plans — Free and Plus. Free gives you core dashboard features at no cost. Plus
                  ($9.99/month or $4.99 for Founding Members) unlocks automation, Concierge Q&A, marketplace perks, and
                  governance rights in the Community Fund.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Early User Benefit:</span> Right now, early adopters
                  get full access to Plus completely free for a limited time. You can explore all premium features and
                  extend your free period by inviting friends through referrals.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Why do Free users still generate fees?</h3>
                <p className="text-muted-foreground">
                  When Free users sign up for financial products through WeLeap, referral/transaction fees are collected
                  by WeLeap to sustain the platform. This keeps the Free plan truly free for everyone.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">What makes Plus different?</h3>
                <p className="text-muted-foreground">
                  In addition to premium features, Plus users' transaction fees go 100% into the Community Fund, rather
                  than to WeLeap. This means your activity funds the community, not the company.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Do I still pay a subscription fee if I'm on Plus?
                </h3>
                <p className="text-muted-foreground">
                  Yes. The monthly or annual subscription fee funds WeLeap's operations, while transaction fees go to
                  the Community Fund.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">How do referrals work?</h3>
                <p className="text-muted-foreground">
                  Every referral earns you 3 credits = 1 free month of Plus. At 9 credits, you unlock governance rights
                  in the Community Fund.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">
                  Absolutely. Upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll
                  prorate any billing differences.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Is my financial data secure?</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted with bank-level security. We use read-only connections to your accounts and
                  never store your banking credentials.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">What if WeLeap doesn't work for me?</h3>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you're not seeing progress in your first month, we'll
                  refund your payment—no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
