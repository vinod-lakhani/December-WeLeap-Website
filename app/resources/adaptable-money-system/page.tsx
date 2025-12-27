import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function AdaptableMoneySystemPage() {
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
              Jun 14, 2025
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />7 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            The Adaptable Money System: Stop Budgeting, Start Building
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Why rigid budgets fail and how you can grow wealth with a dynamic approach.
          </p>

          <div className="mb-6 md:mb-8">
            <img
              src="/images/adaptable-money-full.png"
              alt="Illustration showing the journey from outdated budgets to financial freedom through emergency fund, debt payoff, and home savings"
              className="w-full h-auto object-contain rounded-lg shadow-lg"
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
                Let's be honest, budgets sound amazing in theory. You meticulously track every dollar, set strict limits,
                and follow the plan perfectly. But then, real life happens.
              </p>

              <p>
                Your rent goes up. You get an unexpected bonus. A friend's bachelorette party pops up. You decide you want
                to pay off your student loans faster. A static plan just can't keep up with these changes, and before you
                know it, you've abandoned the whole thing out of frustration.
              </p>

              <p>
                That's because most budgets are designed like a rigid, straight line, and life is more like a winding
                road.
              </p>

              <p>This is where the Adaptable Money System comes in.</p>

              <p>
                Instead of boxing yourself in, you create a system that works with your life, not against it. It's not
                about being perfect; it's about being prepared for what's next.
              </p>

              <p>Here's how it works:</p>

              <p>
                <strong>Start with Your Destination, Not a Rigid Route.</strong> First, you define your big goals. Maybe
                it's building a solid emergency fund, paying down debt, saving for a down payment, or investing for the
                future. These are your destinations. They're what guide every decision you make.
              </p>

              <p>
                <strong>Allocate Your Paycheck Like a Pro.</strong> When you get paid, instead of trying to stuff your
                money into fixed categories, you split it up dynamically based on your current situation. Think of it as a
                fluid process: your needs are covered, your wants are taken care of, and the rest goes toward your growth
                goals.
              </p>

              <p>
                <strong>Adjust on Autopilot.</strong> The magic of this system is that it adjusts with you. Got a bonus?
                Great, more money can go toward your goals. Had a month with fewer expenses? Redirect that extra cash
                instantly. Hit your emergency fund target? Awesome, now you can reallocate that money to something new,
                like an investment account.
              </p>

              <p>
                Think of it like a GPS for your money. The route might change—you might hit traffic or take a different
                turn—but you're always heading toward your final destination. This is how you build momentum without the
                guilt or the constant micromanagement.
              </p>

              <p>
                <strong>💡 Your takeaway:</strong> Don't just budget, adapt. This is how you stay consistent and
                financially strong, no matter what curveballs life throws your way.
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
