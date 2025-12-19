import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

export default function PsychologyOfSpendingPage() {
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
                Jan 15, 2024
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />8 min read
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Vinod Lakhani
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Savings Allocation: How to Grow Your Savings Without Feeling the Pinch
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Build goals into your plan and let automation make it painless.
            </p>

            <div className="my-8 -mx-4 md:mx-0">
              <img
                src="/images/image.png"
                alt="Savings allocation diagram showing checking account flowing into emergency fund, pay off debt, employer match, and long-term wealth jars"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              Saving shouldn't feel like a punishment. It shouldn't be a constant battle of willpower where you're
              asking yourself, "Can I afford this coffee?" or "Am I saving enough?"
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Instead of thinking of saving as a sacrifice, think of it as a strategic build. A good builder wins by
              setting up the right system from the start. That means funding your goals first and letting that
              system—not your willpower—do the heavy lifting.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              You're already doing the hard work of earning a paycheck. But once that money is in your account, what's
              the smartest move? What should you fund first: your emergency fund, your Roth IRA, or that credit card
              with a high interest rate? The confusion and information overload often lead to inaction and missed
              opportunities.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              The Priority Stack: A Blueprint for Your Savings
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              This is where a strategic approach to savings allocation becomes your superpower. You don't have to guess
              or get overwhelmed by all the options. You just follow a clear set of priorities. Think of it as a
              blueprint for your money, designed to maximize every dollar's potential.
            </p>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Emergency Fund</h3>
                <p className="text-gray-700 leading-relaxed">
                  Before you do anything else, secure your financial foundation. This bucket should be filled first
                  until you hit your target (ideally 3-6 months of essential expenses). Having this safety net means you
                  can handle life's unexpected events without getting derailed.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tackle High-Interest Debt</h3>
                <p className="text-gray-700 leading-relaxed">
                  Once your foundation is solid, turn your focus to any unsecured debt with a high APR (over 10%).
                  Paying this down is like getting a guaranteed return on your money—it's one of the smartest moves you
                  can make. It frees up future cash flow for more exciting things.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Capture Your Employer Match</h3>
                <p className="text-gray-700 leading-relaxed">
                  This is the closest thing to free money you will ever find. If your company offers a 401(k) match,
                  contribute at least enough to get the full amount. Missing out on this is leaving money on the table,
                  and a good builder never wastes free materials.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              From Strategy to Action: Optimizing Your Wealth Engine
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              With the essentials covered, you can now focus on building long-term wealth. This is where your individual
              goals come in. You've heard people talk about Roth IRAs and brokerage accounts, and you know they're
              important—but which one is right for you?
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              A smart system can help you navigate these decisions based on your unique situation. For example, it can
              prioritize contributions to tax-advantaged accounts while considering your eligibility and student loan
              status. This ensures your money is growing as efficiently as possible.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              The beauty of this system is that it adapts to your life. The logic is flexible, automatically
              prioritizing what matters most while respecting your individual circumstances and goals.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              WeLeap automates this entire process for you.
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              We'll notify you when you can{" "}
              <strong>"Contribute $95 more this paycheck to capture the full employer match."</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-4">
              If you have a surplus, we'll suggest a move like:{" "}
              <strong>"Shift $100 to debt—saves ~$200 interest over 12 months."</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              And if you're close to an annual limit, we'll let you know:{" "}
              <strong>"You're close to the IRA limit; any overflow will route to Brokerage automatically."</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              That's what real growth looks like—steady progress that fits into your real life, not a rigid budget that
              makes you feel miserable.
            </p>

            <div className="bg-primary-50 p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">💡 Your Takeaway</h3>
              <p className="text-gray-700 leading-relaxed">
                You don't have to guess how to save. By adopting a smart, tiered approach, you build a system that makes
                saving invisible and automatic; your future balance will notice.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed font-semibold">
              👉 Ready to save smarter, not harder? Join the waitlist at www.weleap.ai — painless saving
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
