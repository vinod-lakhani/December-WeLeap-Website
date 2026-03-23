import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function EmergencyFundGuessPage() {
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
              Mar 21, 2026
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
            Most people don&apos;t have an emergency fund. They have a guess.
          </h1>

          <div className="my-6 md:my-8">
            <img
              src="/images/emergency-fund-illustration.png"
              alt="Emergency fund — find your personalized target"
              className="w-full rounded-lg shadow-lg object-cover"
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
                This started bothering me more than I expected.
              </p>

              <p>
                Not because people weren&apos;t saving, but because of how they were thinking about it. Every time the topic came up, the same answer would surface almost immediately: three to six months of expenses. It was always said with a kind of quiet confidence, like it had been settled a long time ago.
              </p>

              <p>
                And if you didn&apos;t think too hard about it, it sounded right.
              </p>

              <p>
                But the moment you asked one more question—why that number?—the confidence usually faded. Not because people were wrong, but because the answer wasn&apos;t really theirs. It was something they had picked up along the way, repeated enough times that it started to feel personal.
              </p>

              <p>
                I realized I had been doing the same thing.
              </p>

              <p>
                For a long time, I treated an emergency fund like a box I needed to check. There was a number, vaguely defined, and the goal was to get there. But I hadn&apos;t really stopped to think about what that number represented in my own life, or what would actually change once I reached it.
              </p>

              <p>
                It wasn&apos;t until I reframed it that it started to click.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                An emergency fund isn&apos;t really about money. It&apos;s about time.
              </h2>

              <p>
                It&apos;s about how much space you give yourself when something doesn&apos;t go according to plan. If income stops, how long before you feel pressure? If something unexpected shows up, how quickly do you have to react? Those are the moments that matter, and the answer is different depending on who you are and how you live.
              </p>

              <p>
                Once I started thinking about it that way, the standard advice felt a little incomplete. Not wrong, just… detached. It didn&apos;t account for how different people&apos;s situations actually are.
              </p>

              <p>
                And even when you settle on a number that does feel right for you, there&apos;s still another problem. The path to get there is usually unclear.
              </p>

              <p>
                Saying &quot;I need fifteen thousand dollars saved&quot; sounds responsible, but it doesn&apos;t tell you what to do next. It doesn&apos;t tell you if you&apos;re moving fast enough, or if you&apos;re falling behind, or what that goal actually looks like month to month. It just sits there, in the background, quietly unresolved.
              </p>

              <p>
                I&apos;ve seen this play out over and over. People don&apos;t ignore the goal because they don&apos;t care. They ignore it because it never becomes concrete.
              </p>

              <p>
                That was the piece that stuck with me.
              </p>

              <p>
                Not the number itself, but the lack of clarity around it.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                What would it look like if instead of guessing, you could actually see it?
              </h2>

              <p>
                Not just the target, but the path. If you knew how much you needed, how long it would take, and what each month contributed toward getting there.
              </p>

              <p>
                That&apos;s ultimately why we built this tool.
              </p>

              <p>
                Not to replace one rule with another, but to remove the ambiguity. To take something that is usually framed as general advice and turn it into something specific enough to act on.
              </p>

              <p>
                If you&apos;re curious what that looks like in practice, you can try it here:
              </p>

              <p className="font-semibold">
                <Link href="/emergency-fund-target" className="text-primary-600 hover:text-primary-700 underline">
                  👉 See your emergency fund plan
                </Link>
              </p>

              <p>
                Because in my experience, most people aren&apos;t stuck because they&apos;re making bad decisions. They&apos;re stuck because they&apos;re operating without a clear picture. And once that picture becomes visible, the decisions themselves tend to get a lot simpler.
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
            Let&apos;s build a future where real finance meets real life.
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
