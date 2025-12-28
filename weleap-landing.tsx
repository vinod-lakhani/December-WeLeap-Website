"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Headphones,
  CreditCard,
  Zap,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react"
import { EarlyAccessDialog } from "./components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY, CARD_STYLES, SPACING } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

/* ===============================
   Typing Animation (STABLE)
   =============================== */
function TypingAnimation() {
  const phrases = [
    "can I spend this week?",
    "should I save this month?",
    "debt can I pay off faster?",
    "will I save if I cancel this?",
    "does this change my net worth?",
  ]

  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const full = phrases[index]
    if (!full) return

    const typeSpeed = 65
    const deleteSpeed = 45
    const pauseMs = 1400

    let timeout: ReturnType<typeof setTimeout>

    // Pause when fully typed
    if (!deleting && text === full) {
      timeout = setTimeout(() => setDeleting(true), pauseMs)
      return () => clearTimeout(timeout)
    }

    // Move to next phrase when fully deleted
    if (deleting && text === "") {
      setDeleting(false)
      setIndex((prev) => (prev + 1) % phrases.length)
      return
    }

    // Continue typing or deleting
    timeout = setTimeout(() => {
      if (deleting) {
        setText((prev) => prev.substring(0, prev.length - 1))
      } else {
        setText((prev) => full.substring(0, prev.length + 1))
      }
    }, deleting ? deleteSpeed : typeSpeed)

    return () => clearTimeout(timeout)
  }, [text, deleting, index])

  return (
    <span className="inline-block text-white break-words w-full leading-[1.6]">
      {text}
      <span className="animate-pulse text-white">|</span>
    </span>
  )
}

/* ===============================
   Page Component
   =============================== */
export default function Component() {
  const testimonials = [
    { id: 1, quote: "Seeing the long-term impact of my rent was eye-opening — no app shows that." },
    { id: 2, quote: "I love seeing how today's choices change my future net worth — it's motivating." },
    { id: 3, quote: "I want to understand what happens if I spend more now vs. invest — this shows it clearly." },
    { id: 4, quote: "I want advice, but I hate asking 'dumb' money questions to family. This feels safe." },
    {
      id: 5,
      quote: "I have accounts but no clue what I'm doing. I need something that helps me grow wealth, not just track it.",
    },
    { id: 6, quote: "Budgeting is hard — this makes it feel manageable." },
  ]

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const testimonialRef = useRef<HTMLDivElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  useEffect(() => {
    if (testimonialRef.current) {
      const cardWidth = (testimonialRef.current.children[0] as HTMLElement)?.clientWidth || 0
      testimonialRef.current.scrollTo({
        left: currentTestimonialIndex * cardWidth,
        behavior: "smooth",
      })
    }
  }, [currentTestimonialIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1,
      )
    }, 3200)

    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <PageShell>
      {/* ================= HERO ================= */}
      <Section variant="brand" className="text-center" isHero>
        <Container>
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-6 md:mb-8 leading-[0.95] tracking-tight max-w-5xl mx-auto")}>
            <span className="block">How much</span>
            <span className="block mt-2 mb-4 md:mb-6 h-[4.5rem] md:h-[6rem] lg:h-[7.5rem] break-words flex items-start justify-center">
              <TypingAnimation />
            </span>
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-white/85 max-w-3xl mx-auto mb-8 md:mb-10 break-words")}>
            WeLeap is your AI financial sidekick. It looks at your full financial picture and gives you one clear next
            step — a smart <span className="font-semibold text-white">Leap</span> — so you're never guessing what to do
            next.
          </p>

          {/* Leaps cards */}
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3", SPACING.cardGap, "max-w-5xl mx-auto mb-8 md:mb-10")}>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm break-words">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
                <p className={cn("font-semibold", TYPOGRAPHY.subtext)}>Save without thinking</p>
              </div>
              <p className={cn("text-white/90", TYPOGRAPHY.subtext)}>
                Shift <span className="font-semibold">3%</span> to savings → <span className="font-semibold">+$412</span> this year
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm break-words">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <p className={cn("font-semibold", TYPOGRAPHY.subtext)}>Cut waste instantly</p>
              </div>
              <p className={cn("text-white/90", TYPOGRAPHY.subtext)}>
                Cancel unused subscription → <span className="font-semibold">+$190</span>/year
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm break-words">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className={cn("font-semibold", TYPOGRAPHY.subtext)}>Get ahead faster</p>
              </div>
              <p className={cn("text-white/90", TYPOGRAPHY.subtext)}>
                Save <span className="font-semibold">$50</span> today → emergency fund <span className="font-semibold">1 month sooner</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <EarlyAccessDialog signupType="hero">
              <Button className="bg-white text-primary-600 hover:bg-gray-100 px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium shadow-lg">
                Get Early Access
              </Button>
            </EarlyAccessDialog>
          </div>
        </Container>
      </Section>

      {/* ================= FEATURES ================= */}
      <Section id="how-it-works" variant="white" className="text-center">
        <Container>
          <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-3 md:mb-4")}>
            Most money apps show you what you did. WeLeap shows you what to do next.
          </h2>
          <p className={cn(TYPOGRAPHY.body, "text-gray-700 max-w-3xl mx-auto mb-10 md:mb-12")}>
            Your Sidekick cuts through the noise and focuses on actions that actually improve your future.
          </p>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3", SPACING.cardGap)}>
            <Card className={cn(CARD_STYLES.base, CARD_STYLES.padding, "shadow-lg")}>
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Headphones className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className={cn("text-lg md:text-xl font-semibold text-gray-900 mb-3")}>Clear Next Steps</h3>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Stop drowning in data. We prioritize your financial life into a single, doable task so you always know exactly what to do next.
                </p>
              </CardContent>
            </Card>
            <Card className={cn(CARD_STYLES.base, CARD_STYLES.padding, "shadow-lg")}>
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <CreditCard className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className={cn("text-lg md:text-xl font-semibold text-gray-900 mb-3")}>Action with Impact</h3>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  See the long-term ripple effect of today's choices. We show you exactly how a $50 saving today grows into a safety net tomorrow.
                </p>
              </CardContent>
            </Card>
            <Card className={cn(CARD_STYLES.base, CARD_STYLES.padding, "shadow-lg")}>
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Zap className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className={cn("text-lg md:text-xl font-semibold text-gray-900 mb-3")}>Aligned Incentives</h3>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  We only win when you do. No ads, no selling your data, and no pushing credit cards you don't need.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ================= INTRO VIDEO ================= */}
      <Section variant="white" className="text-center">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
              {!isVideoPlaying && (
                <div className="absolute top-4 left-0 right-0 z-10">
                  <p className={cn(TYPOGRAPHY.body, "text-white drop-shadow-lg")}>
                    Hit play to learn more about WeLeap
                  </p>
                </div>
              )}
              <video
                src="/Intro.mp4"
                loop
                muted
                playsInline
                className="w-full h-auto mx-auto bg-black"
                controls
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* ================= TESTIMONIALS ================= */}
      <Section variant="brand" className="text-center">
        <Container>
          <h2 className={cn(TYPOGRAPHY.h2, "text-white mb-4")}>What Our Demo Users Have Said</h2>
          <p className={cn(TYPOGRAPHY.body, "text-white/80 mb-12")}>
            Early users don't want another budgeting app — they want guidance they can trust.
          </p>

          <div ref={testimonialRef} className="flex gap-6 md:gap-8 overflow-x-auto overflow-y-hidden snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {testimonials.map((t) => (
              <Card key={t.id} className="min-w-[280px] md:min-w-[300px] max-w-[280px] md:max-w-[300px] bg-black/40 text-white p-6 md:p-8 rounded-2xl snap-start flex-shrink-0">
                <CardContent className="p-0 italic">
                  <p className={cn(TYPOGRAPHY.body, "break-words")}>"{t.quote}"</p>
                  <p className={cn(TYPOGRAPHY.subtext, "text-white/70 mt-3 not-italic")}>– Early Access Member</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ================= CTA ================= */}
      <Section variant="white" className="text-center">
        <Container>
          <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mb-4 md:mb-6")}>
            Want deeper guidance and automation?
          </h2>
          <p className={cn(TYPOGRAPHY.body, "text-gray-700 mb-8 md:mb-10")}>
            Start free, upgrade when ready. Early users lock in founding-member perks.
          </p>
          <EarlyAccessDialog signupType="cta">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl">
              Join Waitlist
            </Button>
          </EarlyAccessDialog>
        </Container>
      </Section>

      {/* ================= FOOTER ================= */}
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
