import type { Metadata } from "next"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why we built an AI financial sidekick that gives you one clear next move instead of another dashboard.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About WeLeap | WeLeap',
    description: 'Why we built an AI financial sidekick that gives you one clear next move instead of another dashboard.',
    url: '/about',
  },
}


// Force dynamic rendering to prevent static generation timeout
export const dynamic = "force-dynamic"

export default function AboutPage() {
  return (
    <PageShell className="bg-canvas">
      {/* Hero Section */}
      <Section variant="canvas" className="text-center" isHero>
        <Container>
          <h1 className="text-balance text-[clamp(2.4rem,4.35vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
            We started this for our own kids.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-subtle">
            WeLeap gives young adults one clear money move at a time — so getting ahead stops depending on already
            knowing what to do.
          </p>
        </Container>
      </Section>

      {/* Mission + Founding Story */}
      <Section variant="white">
        <Container>
          {/* Mission */}
          <div className={cn("text-center", SPACING.sectionGap)}>
            <h2 className={cn(TYPOGRAPHY.h2, "text-black mb-3")}>Our Mission</h2>
            <p className={cn(TYPOGRAPHY.body, "text-primary-600 font-semibold leading-relaxed max-w-3xl mx-auto")}>
              Giving young adults an AI sidekick that turns money stress into lasting financial freedom.
            </p>
          </div>

          {/* Founding Story */}
          <div className="max-w-3xl mx-auto">
            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, "bg-muted/30")}>
              <h3 className={cn(TYPOGRAPHY.h3, "text-black mb-4 text-center")}>Our Founding Story</h3>
              <p className={cn(TYPOGRAPHY.subtext, "md:text-lg text-gray-700 leading-relaxed")}>
                We didn't start WeLeap because we saw a gap in the market. We started it because we saw a gap in support for our kids. As parents of Gen Z daughters, we've watched smart, motivated young adults struggle with money—not because they lack discipline, but because the system wasn't built for them. It's built around profits, not people. WeLeap exists to change that.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Leadership Section */}
      <Section variant="muted">
        <Container>
          <div className={cn("text-center", SPACING.sectionGap)}>
            <div className="flex items-center justify-center mb-3">
              <div className="w-11 h-11 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-green-600 font-semibold text-sm md:text-base tracking-wide">LEADERSHIP</span>
            </div>
            <h2 className={cn(TYPOGRAPHY.h2, "text-black")}>Built for Gen Z — by Parents Who Get It</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Vinod */}
            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.white)}>
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/vinod-lakhani.png"
                    alt="Vinod Lakhani"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className={cn(TYPOGRAPHY.h3, "text-black mb-1")}>Vinod Lakhani</h3>
                  <p className="text-green-600 font-semibold mb-2">Co-founder & CEO</p>
                  <p className="text-gray-600 text-sm">
                    Father of three daughters — in early career, college, and high school
                  </p>

                  <div className="mt-5 space-y-2">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Scaled a business from $50M to $300M+, exited SCUTI AI
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Former exec at Broadcom, Inphi, Bright Machines
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Mission: use AI to level the financial playing field for the next generation
                    </p>
                  </div>

                  <div className="mt-6 border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 italic")}>
                      "I've helped scale massive businesses — now I'm building something that helps my daughters, and
                      yours, thrive."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shubha */}
            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.white)}>
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/shubha.jpeg"
                    alt="Shubhashree Venkatesh"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className={cn(TYPOGRAPHY.h3, "text-black mb-1")}>Shubhashree Venkatesh</h3>
                  <p className="text-green-600 font-semibold mb-2">Head of Engineering</p>
                  <p className="text-gray-600 text-sm">Mother of two - in early career and college</p>

                  <div className="mt-5 space-y-2">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Built high-performance global teams that deliver when it matters most. Deep expertise in creating systems that never fail—because your financial data has to be safe.
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Deep expertise in cloud-native and distributed systems, architecting resilient platforms with up
                      to 99.999% availability across multiple domains
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Proven execution leader, partnering closely with Product and cross-functional teams to ship
                      critical initiatives under tight timelines
                    </p>
                  </div>

                  <div className="mt-6 border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 italic")}>
                      "I've spent my career building systems that must work at scale. At WeLeap, we're building systems
                      people can trust with their financial future."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Advisors Section */}
      <Section variant="white">
        <Container>
          <div className={cn("text-center", SPACING.sectionGap)}>
            <div className="flex items-center justify-center mb-3">
              <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-blue-600 font-semibold text-sm md:text-base tracking-wide">ADVISORS</span>
            </div>
            <h2 className={cn(TYPOGRAPHY.h2, "text-black mb-3")}>Trusted Advisors</h2>
            <p className={cn(TYPOGRAPHY.subtext, "md:text-lg text-gray-600 max-w-3xl mx-auto")}>
              Experts who helped shape WeLeap early and continue to guide our vision.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.muted)}>
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src="/images/maurizio-greco.png"
                    alt="Maurizio Greco"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className={cn(TYPOGRAPHY.h3, "text-black mb-1")}>Maurizio Greco</h3>
                  <p className="text-blue-600 font-semibold mb-2">Advisor (Co-founder, former CTO)</p>
                  <p className="text-gray-600 text-sm">Father of two — in college and middle school</p>

                  <div className="mt-5 space-y-2">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Deep tech architect for HSBC, Standard Chartered, and Bank of China
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Co-founded Chronicled (blockchain infrastructure for pharma)
                    </p>
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                      • Provides strategic guidance on technical architecture and product vision
                    </p>
                  </div>

                  <div className="mt-6 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
                    <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 italic")}>
                      "I've spent my career building tech for banks. Now I'm building for people."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* What We Believe */}
      <Section variant="white">
        <Container>
          <div className={cn("text-center", SPACING.sectionGap)}>
            <p className={cn(TYPOGRAPHY.subtext, "md:text-lg text-gray-600 italic max-w-3xl mx-auto mb-6")}>
              These principles guide everything we build, rooted in our mission to serve the next generation.
            </p>
            <h2 className={cn(TYPOGRAPHY.h2, "text-black")}>What We Believe</h2>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-3", SPACING.cardGap, "max-w-5xl mx-auto")}>
            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.white, "flex flex-col")}>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className={cn("text-lg md:text-xl font-bold text-black mb-3 text-center")}>Action over dashboards</h3>
              <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 text-center flex-grow")}>
                Financial wellness isn't about having more information—it's about taking the right action at the right time. We believe in progress over perfection, and clarity over complexity.
              </p>
            </div>

            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.white, "flex flex-col")}>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className={cn("text-lg md:text-xl font-bold text-black mb-3 text-center")}>Clarity over clutter</h3>
              <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 text-center flex-grow")}>
                We believe that financial tools should reduce stress, not create it. Every feature we build is designed to simplify your financial life, not complicate it with unnecessary complexity.
              </p>
            </div>

            <div className={cn(CARD_STYLES.base, CARD_STYLES.padding, CARD_STYLES.white, "flex flex-col")}>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className={cn("text-lg md:text-xl font-bold text-black mb-3 text-center")}>We only win when you do</h3>
              <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 text-center flex-grow")}>
                No ads, no selling your data, and no pushing credit cards you don't need. If we ever earn a referral fee,
                we tell you on the spot.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section variant="deep" className="text-center">
        <Container>
          <h2 className="text-balance text-[clamp(1.9rem,3.2vw,2.7rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
            Find out what your money should be doing.
          </h2>
          <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Connect your accounts and get your first Leap in about two minutes. Free while we're in early access.
          </p>
          <EarlyAccessDialog signupType="cta" placement="about_cta">
            <Button className="rounded-full bg-white px-9 py-[17px] text-[17px] font-bold text-brand-700 shadow-lg transition hover:-translate-y-px">
              Get your first Leap →
            </Button>
          </EarlyAccessDialog>
        </Container>
      </Section>

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  )
}
