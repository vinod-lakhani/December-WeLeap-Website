import type { Metadata } from "next"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import { ArticleJsonLd } from '@/components/ArticleJsonLd'

/**
 * /resources/negotiate-your-offer — the how-to the offer tool links to.
 *
 * From the Purdue career-center tester, 27 Oct 2026: "a lot of early career
 * professionals make the mistake of settling for what they're given and not
 * even trying to negotiate… a brief spiel on why this matters and how to
 * effectively/respectfully negotiate… would be extremely helpful and
 * empowering for students."
 *
 * The offer tool already priced each possible ask, in the "Before you counter"
 * card; what it never said was that asking is normal. This is that, kept short
 * and practical. No statistics — there is no source for "X% of employers
 * expect a counter" good enough to print — and the one worked figure below is
 * arithmetic anybody can check.
 */

const DESCRIPTION =
  'A first offer is an opening number. What to ask for, how to ask without risking the offer, and why a few thousand at the start is worth far more than it looks.'

export const metadata: Metadata = {
  title: 'How to negotiate your first job offer',
  description: DESCRIPTION,
  alternates: { canonical: '/resources/negotiate-your-offer' },
  openGraph: {
    title: 'How to negotiate your first job offer | WeLeap',
    description: DESCRIPTION,
    url: '/resources/negotiate-your-offer',
    images: [{ url: '/images/negotiate-offer.jpg', width: 1600, height: 900 }],
  },
}

const H2 = cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")

export default function NegotiateYourOfferPage() {
  return (
    <PageShell>
      <ArticleJsonLd href="/resources/negotiate-your-offer" />
      <Section variant="white" isHero>
        <Container maxWidth="narrow">
          <Link href="/resources" className={cn("inline-flex items-center text-brand-700 hover:text-brand-800 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Oct 28, 2026
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              5 min read
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Vinod Lakhani
            </div>
          </div>

          <h1 className={cn(TYPOGRAPHY.h1, "text-gray-900 mb-6 md:mb-8")}>
            Your first offer isn&apos;t the last number. Here&apos;s how to ask for more.
          </h1>

          <div className="my-6 md:my-8">
            <Image
              src="/images/negotiate-offer.jpg"
              alt="A first offer of $72,000 becoming $76,000 after asking"
              width={1600}
              height={900}
              priority
              sizes="(max-width: 896px) 100vw, 848px"
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
          </div>
        </Container>
      </Section>

      <Section variant="white">
        <Container maxWidth="narrow">
          <article className="prose prose-lg max-w-none">
            <div className={cn(TYPOGRAPHY.body, "text-gray-700 space-y-4 md:space-y-6")}>
              <p>
                The most common mistake with a first job offer isn&apos;t asking for too much. It&apos;s not asking at
                all — accepting the opening number because it&apos;s more than you&apos;ve earned before, or because
                asking feels like it might cost you the job.
              </p>

              <p>
                It almost never does. A polite, specific question about the offer is an ordinary part of hiring, and
                the realistic worst case is a straightforward &quot;this is our best offer&quot; — after which you
                accept exactly what you would have accepted anyway. An offer that is withdrawn because somebody asked
                respectfully is rare enough that, if it happens, it tells you something about the place you would have
                been working.
              </p>

              <h2 className={H2}>Why a few thousand at the start is worth much more than a few thousand</h2>

              <p>
                Raises are usually a percentage of your current pay. So a higher starting base doesn&apos;t pay off once
                — it is carried into every raise after it. Take $4,000 more in starting salary and assume 3% raises a
                year: over ten years that one conversation is worth about <strong>$45,900</strong> in extra pay, and by
                year ten the gap is over $5,200 a year on its own. That is before anything it adds to a 401(k) match,
                which is also a percentage of pay.
              </p>

              <p>
                The same conversation is never cheaper than it is now. Once you have accepted, the next chance to move
                your base is a review cycle, and a raise there is usually a few percent of a number you have already
                agreed to.
              </p>

              <h2 className={H2}>What to ask for — it isn&apos;t only salary</h2>

              <p>
                Base salary is the ask that compounds, so it is usually the first one. But when a company can&apos;t
                move base — a set band, a fixed new-grad rate — other parts of an offer are often easier to change:
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li><strong>A signing bonus.</strong> Paid once, so it doesn&apos;t raise the company&apos;s cost every year. Often the easiest yes.</li>
                <li><strong>Relocation.</strong> Moving costs are real and one-off; covering them is routine for many employers.</li>
                <li><strong>Start date.</strong> Free to give, and worth a lot if you need time to move or finish something.</li>
                <li><strong>Time off.</strong> An extra week has a cash value — a week of your pay.</li>
                <li><strong>Equity,</strong> where it&apos;s offered, and when the next salary review happens.</li>
              </ul>

              <p>
                Internships are the case where the pay rate is most often fixed for every intern in the program. Ask
                anyway, politely — and if the rate can&apos;t move, ask about housing, relocation or travel, which
                often can.
              </p>

              <p>
                If you don&apos;t know which of these is worth the most for your offer, the{' '}
                <Link href="/what-is-my-job-offer-worth" className="text-brand-700 hover:text-brand-800 underline">
                  offer calculator
                </Link>{' '}
                prices each one off your own numbers in its &quot;Before you counter&quot; card — so you can ask for the
                thing that actually moves the total.
              </p>

              <h2 className={H2}>How to ask</h2>

              <ol className="list-decimal space-y-2 pl-6">
                <li><strong>Say you&apos;re excited first, and mean it.</strong> The ask lands as &quot;I want to make this work,&quot; not as a threat.</li>
                <li><strong>Ask for one specific number.</strong> &quot;Is there flexibility on base?&quot; invites a vague answer. &quot;Could you get to $76,000?&quot; gets a real one.</li>
                <li><strong>Give one honest reason.</strong> Another offer, the cost of living in the city, or what similar roles pay. Never invent a competing offer — it is easy to check and it ends the conversation if it is.</li>
                <li><strong>Ask once, then stop.</strong> One clear request, and let them come back. You don&apos;t need to justify it three times.</li>
                <li><strong>Get the final terms in writing</strong> before you accept.</li>
              </ol>

              <p>Something as short as this is enough:</p>

              <blockquote className="border-l-4 border-brand-700 bg-gray-50 px-5 py-4 not-italic text-gray-700">
                Thank you — I&apos;m really excited about this role and the team. Before I sign, I wanted to ask whether
                there&apos;s room on the base salary. Given the cost of living in Austin, $76,000 would make this an easy
                yes for me. Is that something you could do?
              </blockquote>

              <h2 className={H2}>If they say no</h2>

              <p>
                Then you know the offer is as good as it gets, and you can decide on it clearly — which is the point.
                Thank them, and if base can&apos;t move, it&apos;s fair to ask once about one of the other items above.
                Then accept or decline on the merits, without apologising for having asked.
              </p>

              <p className="font-semibold">
                <Link href="/what-is-my-job-offer-worth" className="text-brand-700 hover:text-brand-800 underline">
                  👉 See what your offer is really worth, and which ask moves it most
                </Link>
              </p>

              <p className="text-sm text-gray-500">
                General guidance, not legal or employment advice. Practices differ by company, industry and country,
                and this page has no salary benchmark data for your role.
              </p>
            </div>
          </article>
        </Container>
      </Section>

      <Section variant="white" className="text-center">
        <Container maxWidth="narrow">
          <EarlyAccessDialog signupType="resource">
            <Button className="bg-brand-700 hover:bg-brand-800 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
              Create free account
            </Button>
          </EarlyAccessDialog>
          <p className={cn(TYPOGRAPHY.body, "text-gray-600 mt-4 md:mt-6")}>
            Let&apos;s build a future where real finance meets real life.
          </p>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
