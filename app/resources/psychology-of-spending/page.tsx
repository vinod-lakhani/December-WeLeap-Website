import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function PsychologyOfSpendingPage() {
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
              May 9, 2025
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />8 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            Savings Allocation: How to Grow Your Savings Without Feeling the Pinch
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Build goals into your plan and let automation make it painless.
          </p>

          <div className="my-6 md:my-8">
            <img
              src="/images/image.png"
              alt="Savings allocation diagram showing checking account flowing into emergency fund, pay off debt, employer match, and long-term wealth jars"
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
                Saving shouldn't feel like a punishment. It shouldn't be a constant battle of willpower where you're
                asking yourself, "Can I afford this coffee?" or "Am I saving enough?"
              </p>

              <p>
                Instead of thinking of saving as a sacrifice, think of it as a strategic build. A good builder wins by
                setting up the right system from the start. That means funding your goals first and letting that
                system—not your willpower—do the heavy lifting.
              </p>

              <p>
                You're already doing the hard work of earning a paycheck. But once that money is in your account, what's
                the smartest move? What should you fund first: your emergency fund, your Roth IRA, or that credit card
                with a high interest rate? The confusion and information overload often lead to inaction and missed
                opportunities.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                The Priority Stack: A Blueprint for Your Savings
              </h2>

              <p>
                This is where a strategic approach to savings allocation becomes your superpower. You don't have to guess
                or get overwhelmed by all the options. You just follow a clear set of priorities. Think of it as a
                blueprint for your money, designed to maximize every dollar's potential.
              </p>

              <div className="space-y-4 md:space-y-6 my-6 md:my-8">
                <div>
                  <h3 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Build Your Emergency Fund</h3>
                  <p>
                    Before you do anything else, secure your financial foundation. This bucket should be filled first
                    until you hit your target (ideally 3-6 months of essential expenses). Having this safety net means you
                    can handle life's unexpected events without getting derailed.
                  </p>
                </div>

                <div>
                  <h3 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Tackle High-Interest Debt</h3>
                  <p>
                    Once your foundation is solid, turn your focus to any unsecured debt with a high APR (over 10%).
                    Paying this down is like getting a guaranteed return on your money—it's one of the smartest moves you
                    can make. It frees up future cash flow for more exciting things.
                  </p>
                </div>

                <div>
                  <h3 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>Capture Your Employer Match</h3>
                  <p>
                    This is the closest thing to free money you will ever find. If your company offers a 401(k) match,
                    contribute at least enough to get the full amount. Missing out on this is leaving money on the table,
                    and a good builder never wastes free materials.
                  </p>
                </div>
              </div>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                From Strategy to Action: Optimizing Your Wealth Engine
              </h2>

              <p>
                With the essentials covered, you can now focus on building long-term wealth. This is where your individual
                goals come in. You've heard people talk about Roth IRAs and brokerage accounts, and you know they're
                important—but which one is right for you?
              </p>

              <p>
                A smart system can help you navigate these decisions based on your unique situation. For example, it can
                prioritize contributions to tax-advantaged accounts while considering your eligibility and student loan
                status. This ensures your money is growing as efficiently as possible.
              </p>

              <p>
                The beauty of this system is that it adapts to your life. The logic is flexible, automatically
                prioritizing what matters most while respecting your individual circumstances and goals.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                WeLeap automates this entire process for you.
              </h2>

              <p>
                We'll notify you when you can{" "}
                <strong>"Contribute $95 more this paycheck to capture the full employer match."</strong>
              </p>

              <p>
                If you have a surplus, we'll suggest a move like:{" "}
                <strong>"Shift $100 to debt—saves ~$200 interest over 12 months."</strong>
              </p>

              <p>
                And if you're close to an annual limit, we'll let you know:{" "}
                <strong>"You're close to the IRA limit; any overflow will route to Brokerage automatically."</strong>
              </p>

              <p>
                That's what real growth looks like—steady progress that fits into your real life, not a rigid budget that
                makes you feel miserable.
              </p>

              <div className="bg-primary-50 p-6 md:p-8 rounded-lg my-6 md:my-8">
                <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>💡 Your Takeaway</h3>
                <p>
                  You don't have to guess how to save. By adopting a smart, tiered approach, you build a system that makes
                  saving invisible and automatic; your future balance will notice.
                </p>
              </div>

              <p className="font-semibold">
                👉 Ready to save smarter, not harder? Join the waitlist at www.weleap.ai — painless saving
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
