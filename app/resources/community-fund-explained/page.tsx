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
              Jan 22, 2024
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
            The WeLeap Community Fund — A Financial First
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            What if every time you signed up for a financial product, the fee didn't disappear into a corporation's revenue stream — but flowed back into your community? That's the idea behind the WeLeap Community Fund.
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
                The WeLeap Community Fund is a shared pool of value created by the community, for the community. Here's how it works: when Plus members generate transaction or referral fees, 100% of those fees flow into the Community Fund. The Fund is not controlled by WeLeap.
              </p>

              <p>
                This isn't charity. It's a structural shift in who benefits when money moves.
              </p>

              <p>
                <strong>Governed by members, not executives.</strong> Control matters as much as transparency. That's why the Community Fund is governed by members: earn 9 credits through referrals, and you unlock voting rights. Members vote on how funds are allocated. WeLeap executes — the community decides. Over time, governance expands as the community grows.
              </p>

              <p>
                <strong>What the Fund can be used for.</strong> The Community Fund is designed to support real, tangible impact. Initial allocation categories include: new feature development voted on by users, dividends or credits back to members, financial literacy grants, emergency debt-relief micro-grants, and community events and programs.
              </p>

              <p>
                Not everything will launch at once — but the direction is clear: shared upside, shared decision-making.
              </p>

              <p>
                <strong>Radical transparency, by design.</strong> Trust only works if it's earned. That's why WeLeap commits to public dashboards showing inflows and allocations, clear explanations of how decisions are made, and no hidden pools or off-balance-sheet games. If money moves, you'll be able to see where it went — and why.
              </p>

              <p>
                <strong>Why this hasn't been done before.</strong> Most platforms couldn't do this even if they wanted to. Their business models depend on maximizing transaction volume, steering users toward higher-paying products, and keeping control centralized. WeLeap was built from day one to challenge that structure.
              </p>

              <p>
                <strong>💡 Your takeaway:</strong> Upgrade to Plus. Take part in governing the Community Fund. And help build a financial system where the upside flows back to the people who create it.
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
