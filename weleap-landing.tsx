"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Headphones, CreditCard, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { Navigation } from "./components/navigation"
import { EarlyAccessDialog } from "./components/early-access-dialog"
import Link from "next/link"

function TypingAnimation() {
  const phrases = [
    "should I save?",
    "can I afford?",
    "should I invest?",
    "do I need for retirement?",
    "should I spend on this?",
  ]

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex]

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          setCurrentText(currentPhrase.substring(0, currentText.length - 1))

          if (currentText === "") {
            setIsDeleting(false)
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
          }
        } else {
          setCurrentText(currentPhrase.substring(0, currentText.length + 1))

          if (currentText === currentPhrase) {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? 50 : isPaused ? 2000 : 100,
    )

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentPhraseIndex, phrases])

  return (
    <span
      style={{
        color: "#ffffff",
        backgroundColor: "transparent",
      }}
    >
      {currentText}
      <span
        className="animate-pulse"
        style={{
          color: "#ffffff",
          backgroundColor: "transparent",
        }}
      >
        |
      </span>
    </span>
  )
}

export default function Component() {
  const testimonials = [
    {
      id: 1,
      quote: "Seeing the long-term impact of my rent was eye-opening — no app shows that.",
    },
    {
      id: 2,
      quote: "I love seeing how today's choices change my future net worth — it's motivating.",
    },
    {
      id: 3,
      quote: "I want to understand what happens if I spend more now vs. invest — this shows it clearly.",
    },
    {
      id: 4,
      quote: "I want advice, but I hate asking 'dumb' money questions to family. This feels safe.",
    },
    {
      id: 5,
      quote:
        "I have accounts but no clue what I'm doing. I need something that helps me grow wealth, not just track it.",
    },
    {
      id: 6,
      quote: "Budgeting is hard — this makes it feel manageable.",
    },
  ]

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const testimonialRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (testimonialRef.current) {
      const cardWidth = testimonialRef.current.children[0]?.clientWidth || 0
      testimonialRef.current.scrollTo({
        left: currentTestimonialIndex * cardWidth,
        behavior: "smooth",
      })
    }
  }, [currentTestimonialIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))
    }, 3000) // Reduced to 3 seconds for smoother continuous sliding

    return () => clearInterval(interval)
  }, [testimonials.length])

  const goToPreviousTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))
  }

  const goToNextTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-40 pb-20" style={{ backgroundColor: "#386641" }}>
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-black/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Supported by Berkeley SkyDeck Pad13
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                How much
                <span className="block">
                  <TypingAnimation />
                </span>
              </h1>

              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
                AI-powered financial guidance that adapts to your unique goals and situation. Get personalized
                recommendations for all your money questions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <EarlyAccessDialog>
                  <Button className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
                    Join Waitlist
                  </Button>
                </EarlyAccessDialog>
              </div>
            </div>
          </div>
        </div>
        {/* Video/Demo Section */}
        <div className="relative w-full max-w-4xl mx-auto mt-16">
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10 aspect-video">
            <video className="w-full h-auto" controls playsInline preload="metadata">
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Intro-zz9pyEHogarWgwA7DeLgDdVIRlOHT3.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for your financial future</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Three core features that transform how you manage money
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white border border-gray-200 shadow-lg shadow-gray-900/5 rounded-2xl p-8 hover:bg-gray-50 transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <Headphones className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Trusted Guidance</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Your AI agent learns your preferences and provides advice you can trust, eliminating
                    second-guessing.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-lg shadow-gray-900/5 rounded-2xl p-8 hover:bg-gray-50 transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <CreditCard className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Automation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Turn your financial intentions into intelligent defaults with customizable automation that works for
                    you.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-lg shadow-gray-900/5 rounded-2xl p-8 hover:bg-gray-50 transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Effortless Discovery</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Stop hunting for financial products. Your AI finds the best loans, cards, and accounts tailored to
                    your needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20" style={{ backgroundColor: "#386641" }}>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">What Our Demo Users Have Said</h2>
            </div>

            <div ref={testimonialRef} className="flex overflow-hidden snap-x snap-mandatory scroll-smooth gap-8 pb-4">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="flex-none w-full md:w-1/2 lg:w-[32%] bg-black/40 border border-white/20 shadow-lg shadow-black/10 rounded-2xl p-8 text-white backdrop-blur-sm snap-center min-h-[220px]" // Adjusted width and added min-height
                >
                  <CardContent className="p-0">
                    <p className="text-xl font-semibold leading-relaxed leading-7 italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* Navigation Arrows moved outside max-w-6xl div but inside container */}
          <Button
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/60 text-white p-2 rounded-full shadow-lg z-10 hidden md:flex items-center justify-center ml-2"
            onClick={goToPreviousTestimonial}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/60 text-white p-2 rounded-full shadow-lg z-10 hidden md:flex items-center justify-center mr-2"
            onClick={goToNextTestimonial}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to transform your financial future?</h2>
              <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
                Join thousands of users who are already making smarter financial decisions with WeLeap.
              </p>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-xl text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
                Get Started Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p className="mb-2 md:mb-0">© 2024 WeLeap. Backed by Berkeley SkyDeck.</p>
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
