import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function IncomeAllocationPage() {
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
              Jan 3, 2024
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />9 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            Income Allocation: The Blueprint to Make Your Paycheck Work Smarter
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Tired of feeling behind? Learn the simple system to turn your income into a wealth-building engine.
          </p>

          <div className="my-6 md:my-8">
            <img
              src="/images/income-allocation-cover.png"
              alt="Paycheck allocation diagram showing money flowing from paycheck into three buckets: Fixed expenses, Variable expenses, and Growth"
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
                Ever feel like you're doing all the right things—you got a good job, you're side hustling—but you still
                feel like you're playing catch-up with your money? You see everyone else on social media talking about
                Roth IRAs, ETFs, and buying homes, and it's easy to feel lost and overwhelmed by all the options. You want
                to grow your money, but you don't know where to start or how to prioritize. You're not alone. Many of us
                have extra cash that just sits in a checking account because we don't know what to do with it. This isn't
                about budgeting down to the last penny. It's about building a simple, automated system that gives every
                dollar a job. It's the difference between earning a paycheck and building real wealth.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                The 3-Bucket Method: Your Financial Blueprint
              </h2>

              <p>
                You wouldn't start a construction project without a blueprint. The 3-Bucket Method is your financial
                blueprint, giving you a clear, actionable plan for your money. Think of your paycheck as raw materials and
                the three buckets as your storage units, each with a specific purpose.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Bucket 1: The Fixed Foundation</h3>

              <p>
                This is for your non-negotiable expenses—the structural beams of your financial life. These are the bills
                that don't change month to month.
              </p>

              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>Rent or mortgage</li>
                <li>Utilities (internet, electricity, etc.)</li>
                <li>Insurance premiums</li>
                <li>Minimum debt payments</li>
              </ul>

              <p>
                Fill this bucket first. This ensures your foundation is solid and secure, covering your baseline living
                costs before anything else.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Bucket 2: The Variable Materials</h3>

              <p>
                This is your "life happens" fund. It's for flexible, everyday spending that changes week to week.
              </p>

              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>Groceries and dining out</li>
                <li>Gas or public transportation</li>
                <li>Entertainment and social life</li>
                <li>Shopping and personal care</li>
              </ul>

              <p>
                You set a cap for this bucket. Once it's funded, you can spend this money freely, guilt-free, knowing
                you've already covered your essentials and prioritized your future.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Bucket 3: The Growth & Investment Engine</h3>

              <p>
                This is where you go from just earning to growing wealth effortlessly. This bucket is for building your
                future. The money here is not for spending—it's for working for you.
              </p>

              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Emergency Fund:</strong> Your financial safety net. Aim for at least 3-6 months of living
                  expenses.
                </li>
                <li>
                  <strong>Targeted Savings:</strong> Saving for a big project, like a down payment on a house or a new
                  car.
                </li>
                <li>
                  <strong>Smart Investing:</strong> This is where you can start investing the smart way, even if it's your
                  first time. This could be in a Roth IRA, a 401(k), or a simple ETF portfolio.
                </li>
                <li>
                  <strong>Accelerated Debt Payoff:</strong> Paying down debt faster than the minimums.
                </li>
              </ul>

              <p>
                By prioritizing this bucket, you're not just saving; you're building a foundation for a more secure and
                prosperous future. You're catching up and building momentum.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>Putting the System into Action</h2>

              <p>
                The beauty of this method is its simplicity. When your paycheck arrives, you follow a clear process:
              </p>

              <ol className={cn("list-decimal pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Fund your Fixed Bucket first.</strong> Cover all your essential bills.
                </li>
                <li>
                  <strong>Fund your Growth Bucket second.</strong> Pay yourself first by directing a set amount toward
                  your future goals.
                </li>
                <li>
                  <strong>The rest goes into your Variable Bucket.</strong> This is your liquid cash for the month.
                </li>
              </ol>

              <p>
                This system takes the guesswork and paralysis out of your finances. You know exactly what's covered, what
                you can spend, and what's growing for your future. The result is less stress and steady progress toward
                your financial goals.
              </p>

              <p>
                WeLeap automates this for you. Your paycheck hits, and we instantly allocate it into the right buckets—no
                mental math, no "oops, I spent my rent money." We identify your surplus cash and help you put it to work.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Your Takeaway</h3>

              <p>
                You don't need to be a financial wizard to build wealth. By adopting a simple framework like the 3-bucket
                method, you take back control and ensure every dollar from your paycheck is working hard for you. 👉
                Ready to stop feeling behind? Join the waitlist at www.weleap.ai and make every paycheck count
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
