"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Headphones,
  CreditCard,
  Zap,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react"
import { Navigation } from "./components/navigation"
import { EarlyAccessDialog } from "./components/early-access-dialog"
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
    <span className="inline-block text-white text-balance">
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
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ================= HERO ================= */}
      <section className="pt-36 pb-16 md:pt-40 md:pb-20 bg-[#386641]">
        <div className="container mx-auto px-6 text-center">

          <h1 className="mx-auto max-w-5xl text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[0.95] tracking-tight">
            <span className="block">How much</span>
            <span className="block mt-2 min-h-[3.5rem] md:min-h-[4.25rem] lg:min-h-[4.75rem]">
              <TypingAnimation />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto mb-10">
            WeLeap is your AI financial sidekick. It looks at your full financial picture and gives you one clear next
            step — a smart <span className="font-semibold text-white">Leap</span> — so you’re never guessing what to do
            next.
          </p>

          {/* Leaps cards */}
          <div className="max-w-5xl mx-auto mb-10 grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold">Save without thinking</p>
              </div>
              <p className="text-white/90 text-sm md:text-base">
                Shift <span className="font-semibold">3%</span> to savings → <span className="font-semibold">+$412</span> this year
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold">Cut waste instantly</p>
              </div>
              <p className="text-white/90 text-sm md:text-base">
                Cancel unused subscription → <span className="font-semibold">+$190</span>/year
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-left text-white backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold">Get ahead faster</p>
              </div>
              <p className="text-white/90 text-sm md:text-base">
                Save <span className="font-semibold">$50</span> today → emergency fund <span className="font-semibold">1 month sooner</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <EarlyAccessDialog signupType="hero">
              <Button className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-medium shadow-lg">
                Get Early Access
              </Button>
            </EarlyAccessDialog>
            <a href="#how-it-works" className="text-white underline underline-offset-4 text-base self-center">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Most money apps show numbers. WeLeap tells you what to do.
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-16">
            Your Sidekick cuts through the noise and focuses on actions that actually improve your future.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 rounded-2xl shadow-lg">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                  <Headphones className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Clear Next Steps</h3>
                <p className="text-gray-700">
                  Designed to reduce anxiety, remove guesswork, and turn insight into action.
                </p>
              </CardContent>
            </Card>
            <Card className="p-8 rounded-2xl shadow-lg">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                  <CreditCard className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Action with Impact</h3>
                <p className="text-gray-700">
                  Designed to reduce anxiety, remove guesswork, and turn insight into action.
                </p>
              </CardContent>
            </Card>
            <Card className="p-8 rounded-2xl shadow-lg">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Aligned Incentives</h3>
                <p className="text-gray-700">
                  Designed to reduce anxiety, remove guesswork, and turn insight into action.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 bg-[#386641]">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          <h2 className="text-4xl font-bold text-white mb-4">What Our Demo Users Have Said</h2>
          <p className="text-white/80 text-lg mb-12">
            Early users don’t want another budgeting app — they want guidance they can trust.
          </p>

          <div ref={testimonialRef} className="flex gap-8 overflow-hidden">
            {testimonials.map((t) => (
              <Card key={t.id} className="min-w-[300px] bg-black/40 text-white p-8 rounded-2xl">
                <CardContent className="p-0 italic text-lg">"{t.quote}"</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 bg-white text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Want deeper guidance and automation?
        </h2>
        <p className="text-xl text-gray-700 mb-10">
          Start free, upgrade when ready. Early users lock in founding-member perks.
        </p>
        <Link href="/pricing">
          <Button className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-xl text-lg">
            See Pricing
          </Button>
        </Link>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p className="mb-2 md:mb-0">© 2024 WeLeap.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

