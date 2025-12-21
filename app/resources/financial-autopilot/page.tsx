import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function FinancialAutopilotPage() {
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
            Financial Autopilot Isn't Lazy — It's Smart
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-4")}>
            True automation turns your priorities into rules that run in the background, freeing up brain-space while
            staying aligned with your goals. Learn how to build a system that works for you.
          </p>
          <div className={cn(TYPOGRAPHY.subtext, "text-gray-500 mb-8")}>By Vinod Lakhani • January 12, 2024 • 8 min read</div>

          <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-12">
            <img src="/images/financial-autopilot.jpg" alt="Financial Autopilot" className="w-full h-full object-cover" />
          </div>
        </Container>
      </Section>

      {/* Article Content */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <article className="prose prose-lg max-w-none">
            <div className={cn(TYPOGRAPHY.body, "text-gray-700 space-y-4 md:space-y-6")}>
              <p>
                Imagine a world where your money works for you, effortlessly. Where savings grow, bills are paid, and
                investments mature, all without constant oversight. This isn't a fantasy; it's the power of financial
                autopilot, and it's not lazy—it's incredibly smart.
              </p>
              <p>
                Many people equate "autopilot" with a lack of control or a passive approach to money. In reality, true
                financial automation is about setting up intelligent systems that align with your goals, allowing you to
                focus on what truly matters while your finances hum along in the background.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Myth of Constant Vigilance</h3>
              <p>
                Traditional financial advice often emphasizes meticulous budgeting, daily tracking, and constant
                decision-making. While discipline is important, this approach can be exhausting and unsustainable for most
                people. Life happens, and when it does, our best intentions often fall by the wayside.
              </p>
              <p>
                The result? Financial stress, missed opportunities, and a feeling of being perpetually behind. This isn't a
                failure of character; it's a failure of system design.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Building Your Financial Autopilot</h3>
              <p>A smart financial autopilot system involves a few key components:</p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Automated Savings:</strong> Set up automatic transfers from your checking account to your savings
                  and investment accounts immediately after payday. "Pay yourself first" isn't just advice; it's a rule your
                  system enforces.
                </li>
                <li>
                  <strong>Bill Pay Automation:</strong> Schedule all recurring bills to be paid automatically. This
                  eliminates late fees and ensures your credit score stays healthy.
                </li>
                <li>
                  <strong>Smart Spending Buckets:</strong> Instead of rigid budgets, create "safe-to-spend" amounts for
                  discretionary categories. Once that money is gone, you know to pause spending in that area until the next
                  cycle.
                </li>
                <li>
                  <strong>Goal-Oriented Investing:</strong> Automate contributions to your retirement accounts (401k, IRA)
                  and other investment vehicles. Even small, consistent contributions compound significantly over time.
                </li>
                <li>
                  <strong>Emergency Fund Builder:</strong> Treat your emergency fund like a non-negotiable bill. Automate
                  transfers until you reach your desired buffer.
                </li>
              </ul>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Benefits of Being "Lazy" (and Smart)</h3>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Reduced Stress:</strong> Less worrying about missed payments or whether you're saving enough.
                </li>
                <li>
                  <strong>Consistent Progress:</strong> Your financial goals are consistently worked towards, even when life
                  gets busy.
                </li>
                <li>
                  <strong>Freedom to Focus:</strong> Free up mental energy to pursue passions, career goals, or simply enjoy
                  life.
                </li>
                <li>
                  <strong>Avoidance of Emotional Decisions:</strong> Automation removes the temptation to make impulsive
                  financial choices.
                </li>
              </ul>

              <p>
                Financial autopilot isn't about ignoring your money; it's about designing a system that supports your
                financial well-being without requiring constant manual intervention. It's about being smart enough to set up
                the right rules so you can be "lazy" in the best possible way.
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
