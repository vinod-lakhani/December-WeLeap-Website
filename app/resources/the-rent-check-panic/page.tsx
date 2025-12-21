import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react'
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function TheRentCheckPanicPage() {
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
            The Rent-Check Panic: Why Budgeting Isn't Enough (And What to Do Instead)
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-4")}>
            Learn why this happens and how to restructure your money habits for lasting control. This common experience has less to do with budgeting skills and more to do with how money flows through your life.
          </p>
          <div className={cn(TYPOGRAPHY.subtext, "text-gray-500 mb-8")}>
            By Vinod Lakhani • January 15, 2024 • 5 min read
          </div>

          <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-12">
            <img
              src="/images/rent-check-panic.jpeg"
              alt="Person looking stressed at a laptop with bills and financial documents"
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
                You just got paid. Your bank account looks healthy. You pay rent, maybe a few bills, and suddenly… it's gone. That familiar pit in your stomach, the "rent-check panic," sets in. You're not alone. Millions of people, even those with good incomes, feel broke after payday.
              </p>
              <p>
                The problem isn't always your income, or even your spending habits. It's often how you manage the flow of money, especially when a large chunk disappears right at the start of your pay cycle. Traditional budgeting tools, while helpful for tracking, often fall short in addressing this core issue.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Problem: You're Doing All the Work</h3>
              <p>Most financial tools still rely on you to:</p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>Build your own budget from scratch</li>
                <li>Remember every bill and transfer</li>
                <li>Decide how much to save, when to spend, and where to optimize</li>
              </ul>
              <p>
                If you get it wrong? You pay the price — in fees, missed opportunities, and mental stress. Meanwhile, the system profits from your mistakes.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Solution: A New Approach to Your Paycheck</h3>
              <p>
                Instead of just tracking where your money went, imagine a system that helps you decide where it *should* go, proactively. WeLeap helps you:
              </p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  <strong>Align with your paycheck:</strong> We help you understand your true "safe-to-spend" amount after essential bills, right when your paycheck hits.
                </li>
                <li>
                  <strong>Automate your goals:</strong> Set up automatic transfers for savings, investments, and debt payments that happen *before* you have a chance to spend it.
                </li>
                <li>
                  <strong>Visualize your future:</strong> See the long-term impact of your spending decisions, helping you make conscious choices that align with your financial aspirations.
                </li>
                <li>
                  <strong>Flex with life:</strong> Life is unpredictable. WeLeap helps you adjust your plan quickly when unexpected expenses or income changes occur.
                </li>
              </ul>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Key Takeaways:</h3>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>The "rent-check panic" is a common symptom of a broken financial flow, not necessarily poor budgeting.</li>
                <li>Traditional budgeting often focuses on tracking past spending, not proactive future planning.</li>
                <li>A system that aligns with your paycheck, automates goals, and visualizes impact can transform your financial confidence.</li>
                <li>It's about making your money work for you, not constantly working for your money.</li>
              </ul>

              <p>
                Ready to escape the rent-check panic and take control of your financial future?
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
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors duration-200" aria-label="Share on Facebook">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors duration-200" aria-label="Share on Twitter">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors duration-200" aria-label="Share on LinkedIn">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors duration-200" aria-label="Share via Email">
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
