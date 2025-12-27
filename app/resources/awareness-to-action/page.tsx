import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function AwarenessToActionPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="white" isHero>
        <Container maxWidth="narrow">
          <Link href="/resources" className={cn("inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            From Awareness to Action: Escaping the Passive Budgeting Trap
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-4")}>
            You checked your budget, saw the pie chart, nodded in recognition—and kept spending the same way. Break free
            from passive budgeting and turn financial awareness into real action.
          </p>
          <div className={cn(TYPOGRAPHY.subtext, "text-gray-500 mb-8")}>By Vinod Lakhani • July 7, 2025 • 6 min read</div>

          <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-12">
            <img
              src="/images/awareness-to-action.jpg"
              alt="Person looking at a pie chart, symbolizing budgeting"
              className="w-full h-full object-cover"
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
                If that sounds familiar, you've bumped into the "passive budgeting trap": a cycle where seeing your spending
                feels productive, yet nothing actually changes.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>1. Why Awareness Isn't Enough</h3>
              <p>
                Most budgeting apps excel at reporting—they slice your past transactions into tidy categories. Awareness can
                be empowering, but only when it sparks the next behaviour:
              </p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  📊<strong>Information overload:</strong> Dozens of colourful charts can paralyse rather than motivate.
                </li>
                <li>
                  ⏰<strong>Timing mismatch:</strong> Alerts often arrive after money is already gone.
                </li>
                <li>
                  ❓<strong>No built-in plan:</strong> "You spent $300 on take-out" doesn't answer "What should I do now?"
                </li>
              </ul>
              <p>
                Behavioural research shows that meaningful change hinges on implementation intentions—specific if-then plans
                that turn insight into action.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>2. From Insight to Implementation</h3>
              <p>
                Below are four practical frameworks you can adopt today. Each turns yesterday's data into tomorrow's
                decisions.
              </p>

              <h4 className={cn("text-xl font-semibold text-gray-900 mt-6 mb-3")}>a) Just-in-Time Nudges</h4>
              <p>
                <strong>Rule of thumb:</strong> A reminder is most effective before you tap "Buy", not three days later.
              </p>
              <p>
                <strong>DIY approach:</strong> Set low-balance push notifications on your checking account or create
                calendar pings before big recurring bills.
              </p>

              <h4 className={cn("text-xl font-semibold text-gray-900 mt-6 mb-3")}>b) Paycheck Mapping</h4>
              <p>
                <strong>Concept:</strong> Treat every paycheque as a mini-budget period.
              </p>
              <p>
                <strong>Steps:</strong>
              </p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>List fixed costs due before the next paycheque.</li>
                <li>Reserve for savings goals (emergency fund, debt snowball, etc.).</li>
                <li>Whatever remains is discretionary spending—guilt-free.</li>
              </ul>

              <h4 className={cn("text-xl font-semibold text-gray-900 mt-6 mb-3")}>c) Goal-Based Buckets</h4>
              <p>
                <strong>Why it works:</strong> Named sub-accounts ("Paris trip", "Laptop upgrade") leverage the psychology
                of mental accounting.
              </p>
              <p>
                <strong>Tip:</strong> Most banks now let you open multiple no-fee savings "spaces". Automate transfers the
                day after payday.
              </p>

              <h4 className={cn("text-xl font-semibold text-gray-900 mt-6 mb-3")}>d) Feedback Loops</h4>
              <p>
                <strong>Principle:</strong> Plans should flex with real life—medical bill? Overtime pay? Adapt.
              </p>
              <p>
                <strong>Tool-agnostic tactic:</strong> Review buckets weekly; re-route overflow or replenish shortfalls so
                the system stays realistic.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Key Takeaway</h3>
              <p>
                Build—or choose—a tool that ticks these boxes and you'll move from passive awareness to proactive control.
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

      {/* Share Section */}
      <Section variant="muted" className="text-center">
        <Container maxWidth="narrow">
          <h4 className={cn("text-lg font-semibold text-gray-900 mb-4", TYPOGRAPHY.h3)}>Share this article</h4>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share via Email"
            >
              <Mail className="w-6 h-6" />
            </a>
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
