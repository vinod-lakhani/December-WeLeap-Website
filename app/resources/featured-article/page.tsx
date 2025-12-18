import { Navigation } from "../../components/navigation"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "../../../components/early-access-dialog" // Adjust import path if necessary

export default function FeaturedArticlePage() {
return (
<div className="min-h-screen bg-white">
  <Navigation />

  <main className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
    <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Resources
    </Link>

    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
      Real Finance for Real Life: Why We Built WeLeap
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      We didn���t set out to build another budgeting app. We built WeLeap because the system is broken — and it’s
      failing the very people it claims to serve.
    </p>

    <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-12">
      <img
        src="/images/financial-growth.jpeg"
        alt="Plant growing from coins, symbolizing financial growth"
        className="w-full h-full object-cover"
      />
    </div>

    <article className="prose prose-lg max-w-none text-gray-700">
      <p>
        We watched our daughters graduate, start jobs, and immediately struggle to navigate a financial world
        designed to confuse them. They weren’t alone. From recent grads to working professionals, we kept hearing
        the same thing:
      </p>
      <p className="italic">“I make decent money, but I still feel broke.”</p>

      <p>
        The tools out there? They track your spending, color-code your categories, and show you a pie chart of where
        your money went. But they don’t help you decide what to do next. They weren’t built to act on your behalf.
        And they certainly weren’t built with your best interests in mind.
      </p>

      <h3>The Problem: You’re Doing All the Work</h3>
      <p>Most financial tools still rely on you to:</p>

      <ul>
        <li>Build your own budget from scratch</li>
        <li>Remember every bill and transfer</li>
        <li>Decide how much to save, when to spend, and where to optimize</li>
      </ul>

      <p>
        If you get it wrong? You pay the price — in fees, missed opportunities, and mental stress. Meanwhile, the
        system profits from your mistakes.
      </p>

      <h3>What WeLeap Does Differently</h3>

      <p>WeLeap is a financial sidekick that works with you — and for you.</p>
      <ul>
        <li>
          We align your plan with your paycheck cycle so you always know what’s safe to spend, save, or pause.
        </li>
        <li>We automate smart decisions based on your goals, habits, and real-world needs.</li>
        <li>We give you nudges before things go off track — not just reports after the fact.</li>
        <li>We flex when life changes. Because life always does.</li>
      </ul>

      <h3>We’re on Your Side — Not the System’s</h3>
      <p>
        Let’s be clear: the financial system was built to benefit institutions, not individuals. It thrives when
        you’re overwhelmed, miss payments, or default to whatever product’s easiest to click.
      </p>
      <p>We’re flipping that model.</p>
      <p>
        WeLeap is building a transparent financial marketplace — one where you choose what works best for you, not
        what makes someone else the most money. No sponsored placements. No gimmicks. Just personalized
        recommendations powered by AI, aligned with your goals.
      </p>
      <p>
        Whether it’s finding a better loan, setting up a savings buffer, or adjusting your paycheck strategy, WeLeap
        gives you clear next steps — not confusing choices.
      </p>

      <h3>Built for Our Daughters. Built for You.</h3>
      <p>
        This isn’t just a startup. It’s personal. We built WeLeap because we couldn’t watch another generation face
        the same stress with the same broken tools.
      </p>
      <p>
        You shouldn’t have to be a financial expert to feel confident with money. You just need a system that has
        your back.
      </p>
      <p>That’s WeLeap.</p>
    </article>

    <div className="text-center mt-16">
      <EarlyAccessDialog>
        <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
          Join Waitlist
        </Button>
      </EarlyAccessDialog>
      <p className="text-gray-600 mt-4 text-lg">Let’s build a future where real finance meets real life.</p>
    </div>
  </main>

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
