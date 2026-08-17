import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import { ArticleJsonLd } from '@/components/ArticleJsonLd'

/**
 * The title was 'Featured' and the description "A closer look at one money
 * decision worth getting right" — neither of which describes this article, and
 * "Featured" carries no query signal at all. Both now say what the piece is.
 */
export const metadata: Metadata = {
  title: 'Why we built WeLeap',
  description:
    'We did not set out to build another budgeting app. Why the tools that track your spending never tell you what to actually do next.',
  alternates: { canonical: '/resources/featured-article' },
  openGraph: {
    // Byte-identical to what `title` renders through the root layout's
    // `%s | WeLeap` template — openGraph.title does not inherit it.
    title: 'Why we built WeLeap | WeLeap',
    description:
      'We did not set out to build another budgeting app. Why the tools that track your spending never tell you what to actually do next.',
    url: '/resources/featured-article',
    images: [DEFAULT_OG_IMAGE],
  },
}


export default function FeaturedArticlePage() {
  return (
    <PageShell>
      <ArticleJsonLd href="/resources/featured-article" />
      {/* Hero Section */}
      <Section variant="white" isHero>
        <Container maxWidth="narrow">
          <Link href="/resources" className={cn("inline-flex items-center text-brand-700 hover:text-brand-800 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              December 18, 2025
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />6 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-4 md:mb-6")}>
            Real Finance for Real Life: Why We Built WeLeap
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-8 md:mb-12")}>
            We didn't set out to build another budgeting app. We built WeLeap because the system is broken — and it's
            failing the very people it claims to serve.
          </p>

          <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-12">
            <Image
              src="/images/financial-growth.jpeg"
              alt="Plant growing from coins, symbolizing financial growth"
              fill
              priority
              sizes="(max-width: 896px) 100vw, 848px"
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
            <Button className="bg-brand-700 hover:bg-brand-800 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
              Create free account
            </Button>
          </EarlyAccessDialog>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mt-4 md:mt-6")}>
            Let's build a future where real finance meets real life.
          </p>
        </Container>
      </Section>

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  )
}
