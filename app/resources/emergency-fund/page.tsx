import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

export default function EmergencyFundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Article Header */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="mb-8">
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

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Building Your Emergency Fund: A Step-by-Step Guide
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Stop living paycheck to paycheck. Learn how to build a financial safety net that protects you from life's
              unexpected curveballs.
            </p>

            <div className="my-8 -mx-4 md:mx-0">
              <img
                src="/safety-net-financial-security.jpg"
                alt="Safety net representing financial security"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              Car breaks down. Medical emergency. Sudden job loss. Life has a way of throwing curveballs when you least
              expect them. Without an emergency fund, these unexpected expenses can spiral into debt, stress, and
              financial instability. An emergency fund is your financial safety net—the foundation that keeps you secure
              when life gets uncertain.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              Why You Need an Emergency Fund (Like, Yesterday)
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Most Americans don't have $400 in savings for an emergency. This means when crisis hits, they're forced to
              rely on credit cards, payday loans, or borrowing from family—all of which create more financial stress and
              long-term damage.
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">An emergency fund gives you:</p>

            <ul className="list-disc pl-6 mb-8 text-gray-700 space-y-2">
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

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">How Much Should You Save?</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              The golden rule is 3-6 months of living expenses. But here's the truth: that can feel overwhelming when
              you're just starting out. Instead of getting paralyzed by the big number, break it down into achievable
              milestones:
            </p>

            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-primary-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Level 1: $500 Starter Fund</h4>
                <p className="text-gray-700 leading-relaxed">
                  Your first goal. This covers small emergencies like a flat tire or urgent doctor visit. It's enough to
                  keep you from reaching for a credit card.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Level 2: $1,000 Buffer</h4>
                <p className="text-gray-700 leading-relaxed">
                  Covers more substantial emergencies like a broken appliance or minor car repair. This is where you
                  start to feel real security.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Level 3: 1 Month of Expenses</h4>
                <p className="text-gray-700 leading-relaxed">
                  Calculate your monthly bills (rent, utilities, groceries, etc.). Having one month covered gives you
                  breathing room if income is interrupted.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Level 4: 3-6 Months of Expenses</h4>
                <p className="text-gray-700 leading-relaxed">
                  The ultimate goal. This covers major life disruptions like job loss, extended medical leave, or
                  relocating for a new opportunity.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Step-by-Step: Building Your Emergency Fund</h2>

            <div className="space-y-8 mb-8">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Calculate Your Target Amount</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Start by adding up your essential monthly expenses:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                  <li>Rent or mortgage</li>
                  <li>Utilities (electricity, water, internet)</li>
                  <li>Groceries</li>
                  <li>Transportation</li>
                  <li>Insurance (health, car, renters)</li>
                  <li>Minimum debt payments</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  Multiply this number by 3 (minimum) or 6 (ideal) to get your target emergency fund amount.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Start Small and Be Consistent</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Don't wait until you can save $500 at once. Start with what you can afford:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>$25/week = $1,300/year</li>
                  <li>$50/week = $2,600/year</li>
                  <li>$100/week = $5,200/year</li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Automate Your Savings</h3>
                <p className="text-gray-700 leading-relaxed">
                  The best way to save is to never see the money in the first place. Set up automatic transfers from
                  your checking account to a separate savings account on payday. Treat it like a non-negotiable bill.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 4: Put It in the Right Place</h3>
                <p className="text-gray-700 leading-relaxed mb-4">Your emergency fund should be:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
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
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 5: Boost It with Windfalls</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Accelerate your progress by directing unexpected money straight to your emergency fund:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Tax refunds</li>
                  <li>Work bonuses</li>
                  <li>Birthday money</li>
                  <li>Side hustle income</li>
                  <li>Cash back rewards</li>
                </ul>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Common Mistakes to Avoid</h2>

            <div className="space-y-4 mb-8">
              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">❌ Using It for Non-Emergencies</h4>
                <p className="text-gray-700">
                  A vacation isn't an emergency. A new TV isn't an emergency. Only tap this fund for true unexpected
                  expenses that impact your basic needs.
                </p>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">❌ Investing It Too Aggressively</h4>
                <p className="text-gray-700">
                  Your emergency fund isn't for growth—it's for stability. Keep it liquid and safe, not tied up in
                  stocks that could drop 20% right when you need the money.
                </p>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">❌ Giving Up Too Early</h4>
                <p className="text-gray-700">
                  Building an emergency fund takes time. Don't get discouraged if progress feels slow. Every dollar
                  counts, and consistency beats perfection.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">What If I'm Already in Debt?</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              This is a common dilemma. The answer: do both, but prioritize strategically.
            </p>

            <ol className="list-decimal pl-6 mb-8 text-gray-700 space-y-2">
              <li>Build your starter emergency fund ($500-$1,000) first</li>
              <li>Then focus on paying off high-interest debt aggressively</li>
              <li>Once debt is under control, return to building your full 3-6 month emergency fund</li>
            </ol>

            <p className="text-gray-700 leading-relaxed mb-8">
              Why this order? Because without that initial buffer, any emergency will force you deeper into debt,
              undoing your payoff progress.
            </p>

            <div className="bg-primary-50 p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your Takeaway</h3>
              <p className="text-gray-700 leading-relaxed">
                An emergency fund isn't just about money—it's about peace of mind, freedom, and security. Start small,
                be consistent, and automate the process. Your future self will thank you when life throws its next
                curveball.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed font-semibold">
              👉 Ready to build your financial safety net? Join the WeLeap waitlist at www.weleap.ai and start securing
              your future today.
            </p>
          </div>
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
