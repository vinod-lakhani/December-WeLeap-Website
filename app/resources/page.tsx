"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, TrendingUp, DollarSign, PiggyBank, CreditCard, Wallet } from "lucide-react"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

const blogPosts = [
  {
    id: 1,
    title: "The Rent-Check Panic: Why Budgeting Isn't Enough (And What to Do Instead)",
    excerpt:
      "Learn why this happens and how to restructure your money habits for lasting control. This common experience has less to do with budgeting skills and more to do with how money flows through your life.",
    author: "Vinod Lakhani",
    date: "Aug 18, 2025",
    readTime: "5 min read",
    category: "Saving",
    icon: PiggyBank,
    image: "/images/rent-check-panic.jpeg",
    href: "/resources/the-rent-check-panic",
  },
  {
    id: 2,
    title: "Financial Autopilot Isn't Lazy — It's Smart",
    excerpt:
      "True automation turns your priorities into rules that run in the background, freeing up brain-space while staying aligned with your goals. Learn how to build a system that works for you.",
    author: "Vinod Lakhani",
    date: "Jul 28, 2025",
    readTime: "8 min read",
    category: "Investing",
    icon: TrendingUp,
    image: "/images/financial-autopilot.jpg",
    href: "/resources/financial-autopilot",
  },
  {
    id: 3,
    title: "From Awareness to Action: Escaping the Passive Budgeting Trap",
    excerpt:
      "You checked your budget, saw the pie chart, nodded in recognition—and kept spending the same way. Break free from passive budgeting and turn financial awareness into real action.",
    author: "Vinod Lakhani",
    date: "Jul 7, 2025",
    readTime: "6 min read",
    category: "Emergency Planning",
    icon: DollarSign,
    image: "/images/awareness-to-action.jpg",
    href: "/resources/awareness-to-action",
  },
  {
    id: 4,
    title: "The Adaptable Money System: Stop Budgeting, Start Building",
    excerpt: "Why rigid budgets fail and how you can grow wealth with a dynamic approach.",
    author: "Vinod Lakhani",
    date: "Jun 14, 2025",
    readTime: "7 min read",
    category: "Credit",
    icon: CreditCard,
    image: "/images/adaptable-money-system-thumbnail.png",
    href: "/resources/adaptable-money-system",
  },
  {
    id: 5,
    title: "Why Traditional Financial Tools Fail Builders",
    excerpt:
      "Explore the behavioral patterns that lead to poor financial choices and learn strategies to overcome emotional spending.",
    author: "Vinod Lakhani",
    date: "May 24, 2025",
    readTime: "10 min read",
    category: "Psychology",
    icon: TrendingUp,
    image: "/images/traditional-tools-fail.png",
    href: "/resources/traditional-tools-fail",
  },
  {
    id: 6,
    title: "Income Allocation: The Blueprint to Make Your Paycheck Work Smarter",
    excerpt: "Tired of feeling behind? Learn the simple system to turn your income into a wealth-building engine.",
    author: "Vinod Lakhani",
    date: "May 3, 2025",
    readTime: "9 min read",
    category: "Retirement",
    icon: PiggyBank,
    image: "/images/income-allocation-resources.png",
    href: "/resources/income-allocation",
  },
  {
    id: 7,
    title: "Savings Allocation: How to Grow Your Savings Without Feeling the Pinch",
    excerpt:
      "Build goals into your plan and let automation make it painless. Learn the priority stack for strategic savings allocation.",
    author: "Vinod Lakhani",
    date: "May 9, 2025",
    readTime: "8 min read",
    category: "Saving",
    icon: PiggyBank,
    image: "/images/image.png",
    href: "/resources/psychology-of-spending",
  },
  {
    id: 8,
    title: "Building Your Emergency Fund: A Step-by-Step Guide",
    excerpt:
      "Learn how to build a safety net that protects you from life's unexpected expenses without derailing your financial goals.",
    author: "Vinod Lakhani",
    date: "Sep 30, 2025",
    readTime: "6 min read",
    category: "Emergency Planning",
    icon: DollarSign,
    image: "/safety-net-financial-security.jpg",
    href: "/resources/emergency-fund",
  },
  {
    id: 9,
    title: "Credit Score Myths Debunked: What Really Matters",
    excerpt:
      "Cut through the misinformation and learn what actually impacts your credit score and how to improve it strategically.",
    author: "Vinod Lakhani",
    date: "Oct 20, 2025",
    readTime: "8 min read",
    category: "Credit",
    icon: CreditCard,
    image: "/credit-score-chart-myths.jpg",
    href: "/resources/credit-score-myths",
  },
  {
    id: 10,
    title: "Why WeLeap's Pricing Is Different (and Built for You)",
    excerpt:
      "Most financial apps profit when you spend more. WeLeap breaks that model by aligning incentives with your success, not transactions.",
    author: "Vinod Lakhani",
    date: "Nov 11, 2025",
    readTime: "6 min read",
    category: "Pricing",
    icon: Wallet,
    image: "/images/Pricing.png",
    href: "/resources/pricing-philosophy",
  },
  {
    id: 12,
    title: "Most people don't have an emergency fund. They have a guess.",
    excerpt:
      "Why clarity—not just a number—changes everything. See your path, not just the target.",
    author: "Vinod Lakhani",
    date: "Mar 21, 2026",
    readTime: "5 min read",
    category: "Emergency Planning",
    icon: DollarSign,
    image: "/images/emergency-fund-illustration.png",
    href: "/resources/emergency-fund-guess",
  },
]

export default function ResourcesPage() {
  const handleSubscribe = () => {
    // Substack subscribe URL - update this or use NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL env var
    const substackUrl = process.env.NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL || "https://vinodlakhani.substack.com"
    const subscribeUrl = `${substackUrl}/subscribe`
    
    // Open Substack subscribe page in new window
    window.open(subscribeUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <PageShell className="bg-canvas">
      {/* Hero Section */}
      <Section variant="canvas" className="text-center" isHero>
        <Container>
          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink mb-4 md:mb-6">
            Financial <span className="text-brand-700">Resources</span>
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-subtle max-w-2xl mx-auto mb-6 md:mb-8")}>
            Expert insights, practical tools, and actionable advice to help you make smarter financial decisions.
          </p>
        </Container>
      </Section>

      {/* Featured Post */}
      <Section variant="white">
        <Container>
          <Link href="/resources/featured-article" className="block">
            <Card className="bg-gradient-to-r from-brand-700 to-brand-800 border-0 rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-6 md:p-8 lg:p-12 text-white flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                      <span className={cn(TYPOGRAPHY.subtext, "text-subtle")}>6 min read</span>
                    </div>
                    <div className={cn(TYPOGRAPHY.subtext, "text-subtle mb-4")}>By Vinod Lakhani</div>
                    <h2 className={cn(TYPOGRAPHY.h2, "text-white mb-4 group-hover:underline")}>
                      Real Finance for Real Life: Why We Built WeLeap
                    </h2>
                    <p className={cn(TYPOGRAPHY.body, "text-white/90 mb-6 leading-relaxed")}>
                      We didn't set out to build another budgeting app. We built WeLeap because the system is broken —
                      and it's failing the very people it claims to serve.
                    </p>
                    <Button
                      asChild
                      className="inline-flex items-center justify-center bg-white text-brand-700 hover:bg-gray-100 px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base self-start"
                    >
                      <span>
                        Read Article
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                      </span>
                    </Button>
                  </div>
                  <div className="relative min-h-[200px] md:min-h-[300px] lg:min-h-[400px]">
                    <img
                      src="/images/financial-growth.jpeg"
                      alt="Plant growing from coins, symbolizing financial growth"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </Container>
      </Section>

      {/* Tools now live at /tools. Resources is educational, tools are
          actionable — the C2 research session flagged mixing the two as the
          main source of confusion. One clear pointer, not a duplicate list. */}
      <Section variant="white">
        <Container>
          <Link
            href="/tools"
            className="group flex flex-col items-start gap-5 rounded-card border border-brand-100 bg-brand-50 p-8 transition hover:border-lime md:flex-row md:items-center md:justify-between md:p-10"
          >
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
                Free · No signup
              </div>
              <h2 className="mb-2 text-balance text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
                Six calculators for the decision in front of you.
              </h2>
              <p className="max-w-xl text-[16px] leading-relaxed text-subtle">
                Rent, offer letters, credit-card payoff, emergency fund and more — each answers one real question in
                under a minute.
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-700 px-7 py-3.5 text-[15.5px] font-bold text-white shadow-pill transition group-hover:-translate-y-px">
              Open the tools →
            </span>
          </Link>
        </Container>
      </Section>

      {/* Blog Posts Grid */}
      <Section variant="white">
        <Container>
          <div className="mb-8 md:mb-12">
            <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-3 md:mb-4")}>Articles & Guides</h2>
            <p className={cn(TYPOGRAPHY.body, "text-gray-600 max-w-2xl")}>
              Deep dives, strategies, and insights to help you build a smarter financial future.
            </p>
          </div>
          
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", SPACING.cardGap)}>
            {blogPosts.sort((a, b) => {
              const dateA = new Date(a.date)
              const dateB = new Date(b.date)
              return dateA - dateB
            }).map((post) => {
              const IconComponent = post.icon
              return (
                <Link href={post.href} key={post.id} className="h-full">
                  <Card className={cn("bg-white border-0 shadow-lg shadow-gray-900/5 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 group cursor-pointer h-full flex flex-col")}>
                    <CardContent className="p-0 flex flex-col flex-1">
                      <div className="relative overflow-hidden">
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <div className="bg-brand-50 rounded-lg p-2">
                            <IconComponent className="w-5 h-5 text-brand-700" />
                          </div>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {post.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                          </div>
                        </div>
                        <h3 className={cn("text-xl font-semibold text-gray-900 mb-3 group-hover:text-brand-700 transition-colors duration-200")}>
                          {post.title}
                        </h3>
                        <p className={cn(TYPOGRAPHY.subtext, "text-gray-600 mb-4 leading-relaxed flex-1")}>{post.excerpt}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className={cn("text-sm font-medium text-gray-700", TYPOGRAPHY.subtext)}>{post.author}</span>
                          <span className="text-xs bg-brand-50 text-brand-800 px-2 py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* Newsletter Section */}
      <Section variant="muted" className="text-center">
        <Container maxWidth="narrow">
          <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-3 md:mb-4")}>Stay Updated</h2>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mb-6 md:mb-8")}>
            Don't miss a Leap. Get one actionable financial tip every week—no spam, just strategy.
          </p>
          <Button 
            onClick={handleSubscribe}
            className="bg-brand-700 hover:bg-brand-800 text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-pill transition hover:-translate-y-px"
          >
            Subscribe to our newsletter
          </Button>
        </Container>
      </Section>

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  )
}
