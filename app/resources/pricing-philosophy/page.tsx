import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: 'How we think about pricing',
  description:
    'Why WeLeap charges what it charges, and why the tools stay free.',
  alternates: { canonical: '/resources/pricing-philosophy' },
  openGraph: {
    title: 'How we think about pricing | WeLeap',
    description: 'Why WeLeap charges what it charges, and why the tools stay free.',
    url: '/resources/pricing-philosophy',
    images: [DEFAULT_OG_IMAGE],
  },
}


export default function PricingPhilosophyPage() {
  return (
    <PageShell>
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
              Nov 11, 2025
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
            Why WeLeap's Pricing Is Different (and Built for You)
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Most financial apps make more money when you spend more, borrow more, or sign up for products you don't actually need. WeLeap was built to break that model.
          </p>

          <div className="mb-6 md:mb-8">
            <img
              src="/images/Pricing.png"
              alt="Comparison diagram showing Old Model vs WeLeap Model with aligned incentives"
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
                If you've ever wondered why so many financial tools push credit cards, loans, or constant upsells, the answer is simple: their incentives aren't aligned with yours.
              </p>

              <p>
                Most platforms get paid when you open a new card, take out a loan, roll over debt, or click the "top offer" — which often pays the highest referral fee, not the one that's best for you. That doesn't make them evil. But it does mean their recommendations aren't neutral.
              </p>

              <p>
                <strong>WeLeap is built differently — structurally, not rhetorically.</strong>
              </p>

              <p>
                <strong>We disclose every fee.</strong> When WeLeap earns a referral or transaction fee from your actions, we tell you. Every time. This isn't a legal disclaimer buried in fine print — it's the foundation of how we operate. If we can't be transparent about how we make money, we shouldn't be making it that way.
              </p>

              <p>
                <strong>A share comes back to you.</strong> When you sign up for a financial product through WeLeap and it generates revenue for us, a portion of that revenue comes back to you directly as an individual rebate. You took the action. You should share in the upside. That's not a loyalty perk — it's the right way to align incentives.
              </p>

              <p>
                <strong>Subscriptions, when they launch, stay clean.</strong> Once we introduce paid plans, they'll be straightforward: a flat fee for the service. No hidden upsells, no "premium" recommendations that happen to pay us more. The subscription model keeps our incentives simple — help you get more value, not more transactions.
              </p>

              <p>
                <strong>Why this matters.</strong> WeLeap isn't trying to win by selling you more financial products. We're trying to win by disclosing exactly how money moves and never earning more when you choose worse. If a recommendation pays us, you'll know before you act on it.
              </p>

              <p>
                <strong>Your takeaway:</strong> Join early. Try it free. And see what it feels like when your financial choices benefit you — not just a platform.
              </p>
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
