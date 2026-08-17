"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TOOL_COUNT_WORD } from "@/lib/tools"
import { FEATURED_ARTICLE, GRID_ARTICLES, formatArticleDate, type Article } from "@/lib/articles"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, TrendingUp, DollarSign, PiggyBank, CreditCard, Wallet } from "lucide-react"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

/**
 * Card data now comes from lib/articles.ts, the same registry each article page
 * emits its BlogPosting schema from. It used to be a second hand-typed copy
 * here, which is how two cards ended up advertising reading times the articles
 * themselves disagreed with.
 *
 * Only the icon stays local: the registry holds a name rather than a component
 * so it can be imported by server code that has no business pulling in lucide.
 */
const ICONS = { PiggyBank, TrendingUp, DollarSign, CreditCard, Wallet } as const

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
          <Link href={FEATURED_ARTICLE.href} className="block">
            <Card className="bg-gradient-to-r from-brand-700 to-brand-800 border-0 rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-6 md:p-8 lg:p-12 text-white flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                      <span className={cn(TYPOGRAPHY.subtext, "text-subtle")}>
                        {FEATURED_ARTICLE.readMinutes} min read
                      </span>
                    </div>
                    <div className={cn(TYPOGRAPHY.subtext, "text-subtle mb-4")}>By {FEATURED_ARTICLE.author}</div>
                    <h2 className={cn(TYPOGRAPHY.h2, "text-white mb-4 group-hover:underline")}>
                      {FEATURED_ARTICLE.title}
                    </h2>
                    <p className={cn(TYPOGRAPHY.body, "text-white/90 mb-6 leading-relaxed")}>
                      {FEATURED_ARTICLE.excerpt}
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
                {TOOL_COUNT_WORD.charAt(0).toUpperCase() + TOOL_COUNT_WORD.slice(1)} calculators for the decision in front of you.
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
            {GRID_ARTICLES.map((post: Article) => {
              const IconComponent = ICONS[post.icon]
              return (
                <Link href={post.href} key={post.href} className="h-full">
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
                            {post.datePublished ? formatArticleDate(post.datePublished) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readMinutes} min read
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
