import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function FeaturedArticlePage() {
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
            Real Finance for Real Life: Why We Built WeLeap
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-8 md:mb-12")}>
            We didn't set out to build another budgeting app. We built WeLeap because the system is broken — and it's
            failing the very people it claims to serve.
          </p>

          <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-12">
            <img
              src="/images/financial-growth.jpeg"
              alt="Plant growing from coins, symbolizing financial growth"
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
                We watched our daughters graduate, start jobs, and immediately struggle to navigate a financial world
                designed to confuse them. They weren't alone. From recent grads to working professionals, we kept hearing
                the same thing:
              </p>
              <p className="italic">"I make decent money, but I still feel broke."</p>

              <p>
                The tools out there? They track your spending, color-code your categories, and show you a pie chart of where
                your money went. But they don't help you decide what to do next. They weren't built to act on your behalf.
                And they certainly weren't built with your best interests in mind.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Problem: You're Doing All the Work</h3>
              <p>Most financial tools still rely on you to:</p>

              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>Build your own budget from scratch</li>
                <li>Remember every bill and transfer</li>
                <li>Decide how much to save, when to spend, and where to optimize</li>
              </ul>

              <p>
                If you get it wrong? You pay the price — in fees, missed opportunities, and mental stress. Meanwhile, the
                system profits from your mistakes.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>What WeLeap Does Differently</h3>

              <p>WeLeap is a financial sidekick that works with you — and for you.</p>
              <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.body, "text-gray-700")}>
                <li>
                  We align your plan with your paycheck cycle so you always know what's safe to spend, save, or pause.
                </li>
                <li>We automate smart decisions based on your goals, habits, and real-world needs.</li>
                <li>We give you nudges before things go off track — not just reports after the fact.</li>
                <li>We flex when life changes. Because life always does.</li>
              </ul>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>We're on Your Side — Not the System's</h3>
              <p>
                Let's be clear: the financial system was built to benefit institutions, not individuals. It thrives when
                you're overwhelmed, miss payments, or default to whatever product's easiest to click.
              </p>
              <p>We're flipping that model.</p>
              <p>
                WeLeap is building a transparent financial marketplace — one where you choose what works best for you, not
                what makes someone else the most money. No sponsored placements. No gimmicks. Just personalized
                recommendations powered by AI, aligned with your goals.
              </p>
              <p>
                Whether it's finding a better loan, setting up a savings buffer, or adjusting your paycheck strategy, WeLeap
                gives you clear next steps — not confusing choices.
              </p>

              <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-8 md:mt-10 mb-4")}>Built for Our Daughters. Built for You.</h3>
              <p>
                This isn't just a startup. It's personal. We built WeLeap because we couldn't watch another generation face
                the same stress with the same broken tools.
              </p>
              <p>
                You shouldn't have to be a financial expert to feel confident with money. You just need a system that has
                your back.
              </p>
              <p>That's WeLeap.</p>
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
