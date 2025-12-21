import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function EmergencyFundPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="white" isHero>
        <Container maxWidth="narrow">
          <Link href="/resources" className={cn("inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Jan 18, 2024
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              10 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            Building Your Emergency Fund: A Step-by-Step Guide
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Stop living paycheck to paycheck. Learn how to build a financial safety net that protects you from life's
            unexpected curveballs.
          </p>

          <div className="my-6 md:my-8">
            <img
              src="/safety-net-financial-security.jpg"
              alt="Safety net representing financial security"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </Container>
      </Section>

      {/* Article Content */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <article className="prose prose-lg max-w-none">
            <div className={cn(TYPOGRAPHY.body, "text-gray-700 space-y-4 md:space-y-6")}>
              <p>
                Car breaks down. Medical emergency. Sudden job loss. Life has a way of throwing curveballs when you least
                expect them. Without an emergency fund, these unexpected expenses can spiral into debt, stress, and
                financial instability. An emergency fund is your financial safety net—the foundation that keeps you secure
                when life gets uncertain.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                Why You Need an Emergency Fund (Like, Yesterday)
              </h2>

              <p>
                Most Americans don't have $400 in savings for an emergency. This means when crisis hits, they're forced to
                rely on credit cards, payday loans, or borrowing from family—all of which create more financial stress and
                long-term damage.
              </p>

              <p>An emergency fund gives you:</p>

              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Peace of mind:</strong> Sleep better knowing you're covered if something goes wrong
                </li>
                <li>
                  <strong>Financial independence:</strong> You don't have to rely on others or go into debt
                </li>
                <li>
                  <strong>Flexibility:</strong> You can walk away from toxic jobs or relationships without financial fear
                </li>
                <li>
                  <strong>Protection from debt:</strong> You won't spiral into credit card debt over a car repair
                </li>
              </ul>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>How Much Should You Save?</h2>

              <p>
                The golden rule is 3-6 months of living expenses. But here's the truth: that can feel overwhelming when
                you're just starting out. Instead of getting paralyzed by the big number, break it down into achievable
                milestones:
              </p>

              <div className="space-y-6 my-6 md:my-8">
                <div className="border-l-4 border-primary-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Level 1: $500 Starter Fund</h4>
                  <p>
                    Your first goal. This covers small emergencies like a flat tire or urgent doctor visit. It's enough to
                    keep you from reaching for a credit card.
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Level 2: $1,000 Buffer</h4>
                  <p>
                    Covers more substantial emergencies like a broken appliance or minor car repair. This is where you
                    start to feel real security.
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Level 3: 1 Month of Expenses</h4>
                  <p>
                    Calculate your monthly bills (rent, utilities, groceries, etc.). Having one month covered gives you
                    breathing room if income is interrupted.
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Level 4: 3-6 Months of Expenses</h4>
                  <p>
                    The ultimate goal. This covers major life disruptions like job loss, extended medical leave, or
                    relocating for a new opportunity.
                  </p>
                </div>
              </div>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>Step-by-Step: Building Your Emergency Fund</h2>

              <div className="space-y-6 md:space-y-8 my-6 md:my-8">
                <div>
                  <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Step 1: Calculate Your Target Amount</h3>
                  <p className="mb-4">
                    Start by adding up your essential monthly expenses:
                  </p>
                  <ul className={cn("list-disc pl-5 md:pl-6 space-y-1", TYPOGRAPHY.body, "text-gray-700")}>
                    <li>Rent or mortgage</li>
                    <li>Utilities (electricity, water, internet)</li>
                    <li>Groceries</li>
                    <li>Transportation</li>
                    <li>Insurance (health, car, renters)</li>
                    <li>Minimum debt payments</li>
                  </ul>
                  <p>
                    Multiply this number by 3 (minimum) or 6 (ideal) to get your target emergency fund amount.
                  </p>
                </div>

                <div>
                  <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Step 2: Start Small and Be Consistent</h3>
                  <p className="mb-4">
                    Don't wait until you can save $500 at once. Start with what you can afford:
                  </p>
                  <ul className={cn("list-disc pl-5 md:pl-6 space-y-1", TYPOGRAPHY.body, "text-gray-700")}>
                    <li>$25/week = $1,300/year</li>
                    <li>$50/week = $2,600/year</li>
                    <li>$100/week = $5,200/year</li>
                  </ul>
                </div>

                <div>
                  <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Step 3: Automate Your Savings</h3>
                  <p>
                    The best way to save is to never see the money in the first place. Set up automatic transfers from
                    your checking account to a separate savings account on payday. Treat it like a non-negotiable bill.
                  </p>
                </div>

                <div>
                  <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Step 4: Put It in the Right Place</h3>
                  <p className="mb-4">Your emergency fund should be:</p>
                  <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                    <li>
                      <strong>Accessible:</strong> In a high-yield savings account, not locked in investments
                    </li>
                    <li>
                      <strong>Separate:</strong> Not in your checking account where you'll be tempted to spend it
                    </li>
                    <li>
                      <strong>Earning interest:</strong> Look for online banks offering 4%+ APY
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Step 5: Boost It with Windfalls</h3>
                  <p className="mb-4">
                    Accelerate your progress by directing unexpected money straight to your emergency fund:
                  </p>
                  <ul className={cn("list-disc pl-5 md:pl-6 space-y-1", TYPOGRAPHY.body, "text-gray-700")}>
                    <li>Tax refunds</li>
                    <li>Work bonuses</li>
                    <li>Birthday money</li>
                    <li>Side hustle income</li>
                    <li>Cash back rewards</li>
                  </ul>
                </div>
              </div>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>Common Mistakes to Avoid</h2>

              <div className="space-y-4 my-6 md:my-8">
                <div className="bg-red-50 p-4 md:p-6 rounded-lg">
                  <h4 className={cn("text-lg font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>❌ Using It for Non-Emergencies</h4>
                  <p>
                    A vacation isn't an emergency. A new TV isn't an emergency. Only tap this fund for true unexpected
                    expenses that impact your basic needs.
                  </p>
                </div>

                <div className="bg-red-50 p-4 md:p-6 rounded-lg">
                  <h4 className={cn("text-lg font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>❌ Investing It Too Aggressively</h4>
                  <p>
                    Your emergency fund isn't for growth—it's for stability. Keep it liquid and safe, not tied up in
                    stocks that could drop 20% right when you need the money.
                  </p>
                </div>

                <div className="bg-red-50 p-4 md:p-6 rounded-lg">
                  <h4 className={cn("text-lg font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>❌ Giving Up Too Early</h4>
                  <p>
                    Building an emergency fund takes time. Don't get discouraged if progress feels slow. Every dollar
                    counts, and consistency beats perfection.
                  </p>
                </div>
              </div>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>What If I'm Already in Debt?</h2>

              <p>
                This is a common dilemma. The answer: do both, but prioritize strategically.
              </p>

              <ol className={cn("list-decimal pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>Build your starter emergency fund ($500-$1,000) first</li>
                <li>Then focus on paying off high-interest debt aggressively</li>
                <li>Once debt is under control, return to building your full 3-6 month emergency fund</li>
              </ol>

              <p>
                Why this order? Because without that initial buffer, any emergency will force you deeper into debt,
                undoing your payoff progress.
              </p>

              <div className="bg-primary-50 p-6 md:p-8 rounded-lg my-6 md:my-8">
                <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Your Takeaway</h3>
                <p>
                  An emergency fund isn't just about money—it's about peace of mind, freedom, and security. Start small,
                  be consistent, and automate the process. Your future self will thank you when life throws its next
                  curveball.
                </p>
              </div>

              <p className="font-semibold">
                👉 Ready to build your financial safety net? Join the WeLeap waitlist at www.weleap.ai and start securing
                your future today.
              </p>
            </div>
          </article>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="white" className="text-center">
        <Container maxWidth="narrow">
          <EarlyAccessDialog signupType="resource">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
              Join Waitlist
            </Button>
          </EarlyAccessDialog>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mt-4 md:mt-6")}>
            Let's build a future where real finance meets real life.
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
