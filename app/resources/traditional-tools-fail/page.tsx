import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

export default function TraditionalToolsFailPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Article Header */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Jan 5, 2024
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
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Traditional Financial Tools Fail Builders
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed">
            Ready to grow your wealth, not just measure it? Here's why you need more than a budgeting app.
          </p>

          <div className="mt-8">
            <img
              src="/images/traditional-tools-fail.png"
              alt="Plan, Act, Adapt cycle illustration"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="prose prose-lg max-w-none">
            <p>
              Most financial tools are glorified rearview mirrors—they track where your money’s been. Charts,
              categories, even little guilt trips when you overspend. It's informative, sure. But if you’re the kind of
              person who's actually looking to build wealth—not just observe it—all those reports won’t move you
              forward.
            </p>

            <p>Here’s why the old approaches fall short for true Builders:</p>

            <ul>
              <li>
                <strong>They're backwards-focused.</strong> Knowing what you spent last month won't help you make
                tomorrow's smarter move.
              </li>
              <li>
                <strong>They're inflexible.</strong> Real life isn't a static budget—promotions, side hustles, surprise
                expenses all demand financial agility.
              </li>
              <li>
                <strong>They serve products, not people.</strong> Too many tools are built to sell their agenda, not to
                advance your goals.
              </li>
            </ul>

            <p>
              What's the alternative? Managing money like a living, breathing system. That's where the Plan → Act →
              Adapt cycle comes in.
            </p>

            <h3>1. Plan – Get clear on what you want</h3>
            <p>
              A real plan isn't a spreadsheet prison; it's clarity on what's coming in, what's going out, and where your
              next dollar should go.
            </p>
            <p>
              <strong>Example:</strong> Targeting $5K in credit card debt? Set a simple plan: $300/month to pay it down,
              $200/month to build savings, the rest for your expenses.
            </p>

            <h3>2. Act – Turn intention into progress</h3>
            <p>
              Most people stall at the planning stage. But real momentum comes from action—setting up auto-saves,
              automating investments, using your raise with purpose instead of letting it slip away.
            </p>
            <p>
              <strong>Example:</strong> Auto-transfer $300 to debt and $200 to savings as soon as payday hits. Progress
              becomes automatic.
            </p>

            <h3>3. Adapt – Flex as life changes</h3>
            <p>
              Careers shift, priorities evolve, curveballs happen. Adaptation keeps you moving forward, not starting
              from scratch.
            </p>
            <p>
              <strong>Example:</strong> A raise? Increase your debt payments. Unexpected bill? Hit pause for a
              month—without dismantling your entire plan.
            </p>

            <h3>Takeaway</h3>
            <p>
              If you're serious about building wealth—not just tracking your expenses—ditch tools that only look back.
              Choose one that helps you decide where your money goes next.
            </p>
            <p>
              Join our waitlist at{" "}
              <a href="https://www.weleap.ai" className="text-primary-600 hover:text-primary-700">
                www.weleap.ai
              </a>{" "}
              and be first to try WeLeap's adaptive money system.
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
