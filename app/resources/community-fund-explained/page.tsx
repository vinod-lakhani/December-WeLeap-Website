import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function CommunityFundExplainedPage() {
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
              Dec 1, 2025
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
            What the WeLeap Community Fund Means for You
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Most financial apps collect fees when you take action — and keep them. WeLeap discloses every fee, gives a share back to you directly, and routes the rest into the Community Fund. Here's what that actually means.
          </p>

          <div className="mb-6 md:mb-8">
            <img
              src="/images/Community%20Fund.png"
              alt="WeLeap Community Fund infographic showing fund inflow, governance, and allocations"
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
                When you sign up for a financial product through WeLeap — say, a high-yield savings account or a credit card — WeLeap may earn a referral or transaction fee. That's standard across the industry. What isn't standard is what happens next.
              </p>

              <p>
                <strong>You see the fee. A share comes back to you.</strong> WeLeap discloses every fee we earn from your actions. Then a portion of that fee is returned to you directly as an individual rebate. You took the action. You should share in the upside — not just the platform.
              </p>

              <p>
                <strong>The rest builds something bigger.</strong> The remainder flows into the WeLeap Community Fund. This is a shared pool — not controlled by WeLeap, not a marketing budget. It exists to fund things the community actually wants: financial literacy programs, member rewards, community events, and more. The specifics of how the Fund is used will be shaped by the community as we grow.
              </p>

              <p>
                <strong>Why transparency is the whole point.</strong> Most platforms can't be transparent about fees because their entire business model depends on you not knowing. WeLeap's model is different by design: we earn when you succeed with a better product, not when we steer you toward a worse one. Disclosing fees isn't a risk for us — it's the proof that our incentives are aligned with yours.
              </p>

              <p>
                <strong>Governance — coming as we scale.</strong> Community input over how the Fund is used is something we're building toward deliberately. We want it to be real, not performative — so we're launching it when the community is large enough for it to matter. Founding Members will have early access when it opens.
              </p>

              <p>
                This isn't charity. It's a structural shift in who benefits when money moves.
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
