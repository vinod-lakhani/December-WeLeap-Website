import { Navigation } from "../../../components/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "../../../components/early-access-dialog"
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react"

export default function FinancialAutopilotPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
        <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Resources
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Financial Autopilot Isn’t Lazy — It’s Smart
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          True automation turns your priorities into rules that run in the background, freeing up brain-space while
          staying aligned with your goals. Learn how to build a system that works for you.
        </p>
        <div className="text-gray-500 text-sm mb-8">By Vinod Lakhani • January 12, 2024 • 8 min read</div>

        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-12">
          <img src="/images/financial-autopilot.jpg" alt="Financial Autopilot" className="w-full h-full object-cover" />
        </div>

        <article className="prose prose-lg max-w-none text-gray-700">
          <p>
            Imagine a world where your money works for you, effortlessly. Where savings grow, bills are paid, and
            investments mature, all without constant oversight. This isn't a fantasy; it's the power of financial
            autopilot, and it's not lazy—it's incredibly smart.
          </p>
          <p>
            Many people equate "autopilot" with a lack of control or a passive approach to money. In reality, true
            financial automation is about setting up intelligent systems that align with your goals, allowing you to
            focus on what truly matters while your finances hum along in the background.
          </p>

          <h3>The Myth of Constant Vigilance</h3>
          <p>
            Traditional financial advice often emphasizes meticulous budgeting, daily tracking, and constant
            decision-making. While discipline is important, this approach can be exhausting and unsustainable for most
            people. Life happens, and when it does, our best intentions often fall by the wayside.
          </p>
          <p>
            The result? Financial stress, missed opportunities, and a feeling of being perpetually behind. This isn't a
            failure of character; it's a failure of system design.
          </p>

          <h3>Building Your Financial Autopilot</h3>
          <p>A smart financial autopilot system involves a few key components:</p>
          <ul>
            <li>
              <strong>Automated Savings:</strong> Set up automatic transfers from your checking account to your savings
              and investment accounts immediately after payday. "Pay yourself first" isn't just advice; it's a rule your
              system enforces.
            </li>
            <li>
              <strong>Bill Pay Automation:</strong> Schedule all recurring bills to be paid automatically. This
              eliminates late fees and ensures your credit score stays healthy.
            </li>
            <li>
              <strong>Smart Spending Buckets:</strong> Instead of rigid budgets, create "safe-to-spend" amounts for
              discretionary categories. Once that money is gone, you know to pause spending in that area until the next
              cycle.
            </li>
            <li>
              <strong>Goal-Oriented Investing:</strong> Automate contributions to your retirement accounts (401k, IRA)
              and other investment vehicles. Even small, consistent contributions compound significantly over time.
            </li>
            <li>
              <strong>Emergency Fund Builder:</strong> Treat your emergency fund like a non-negotiable bill. Automate
              transfers until you reach your desired buffer.
            </li>
          </ul>

          <h3>The Benefits of Being "Lazy" (and Smart)</h3>
          <ul>
            <li>
              <strong>Reduced Stress:</strong> Less worrying about missed payments or whether you're saving enough.
            </li>
            <li>
              <strong>Consistent Progress:</strong> Your financial goals are consistently worked towards, even when life
              gets busy.
            </li>
            <li>
              <strong>Freedom to Focus:</strong> Free up mental energy to pursue passions, career goals, or simply enjoy
              life.
            </li>
            <li>
              <strong>Avoidance of Emotional Decisions:</strong> Automation removes the temptation to make impulsive
              financial choices.
            </li>
          </ul>

          <p>
            Financial autopilot isn't about ignoring your money; it's about designing a system that supports your
            financial well-being without requiring constant manual intervention. It's about being smart enough to set up
            the right rules so you can be "lazy" in the best possible way.
          </p>
        </article>

        <div className="text-center mt-16">
          <EarlyAccessDialog>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
              Join Waitlist
            </Button>
          </EarlyAccessDialog>
          <p className="text-gray-600 mt-4 text-lg">Let’s build a future where real finance meets real life.</p>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h4>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
              aria-label="Share via Email"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
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
