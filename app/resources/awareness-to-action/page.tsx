import { Navigation } from "../../../components/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "../../../components/early-access-dialog"
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react"

export default function AwarenessToActionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
        <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Resources
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          From Awareness to Action: Escaping the Passive Budgeting Trap
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          You checked your budget, saw the pie chart, nodded in recognition—and kept spending the same way. Break free
          from passive budgeting and turn financial awareness into real action.
        </p>
        <div className="text-gray-500 text-sm mb-8">By Vinod Lakhani • January 10, 2024 • 6 min read</div>

        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-12">
          <img
            src="/images/awareness-to-action.jpg"
            alt="Person looking at a pie chart, symbolizing budgeting"
            className="w-full h-full object-cover"
          />
        </div>

        <article className="prose prose-lg max-w-none text-gray-700">
          <p>
            If that sounds familiar, you've bumped into the "passive budgeting trap": a cycle where seeing your spending
            feels productive, yet nothing actually changes.
          </p>

          <h3>1. Why Awareness Isn't Enough</h3>
          <p>
            Most budgeting apps excel at reporting—they slice your past transactions into tidy categories. Awareness can
            be empowering, but only when it sparks the next behaviour:
          </p>
          <ul>
            <li>
              📊<strong>Information overload:</strong> Dozens of colourful charts can paralyse rather than motivate.
            </li>
            <li>
              ⏰<strong>Timing mismatch:</strong> Alerts often arrive after money is already gone.
            </li>
            <li>
              ❓<strong>No built-in plan:</strong> "You spent $300 on take-out" doesn't answer "What should I do now?"
            </li>
          </ul>
          <p>
            Behavioural research shows that meaningful change hinges on implementation intentions—specific if-then plans
            that turn insight into action.
          </p>

          <h3>2. From Insight to Implementation</h3>
          <p>
            Below are four practical frameworks you can adopt today. Each turns yesterday's data into tomorrow's
            decisions.
          </p>

          <h4>a) Just-in-Time Nudges</h4>
          <p>
            <strong>Rule of thumb:</strong> A reminder is most effective before you tap "Buy", not three days later.
          </p>
          <p>
            <strong>DIY approach:</strong> Set low-balance push notifications on your checking account or create
            calendar pings before big recurring bills.
          </p>

          <h4>b) Paycheck Mapping</h4>
          <p>
            <strong>Concept:</strong> Treat every paycheque as a mini-budget period.
          </p>
          <p>
            <strong>Steps:</strong>
          </p>
          <ul>
            <li>List fixed costs due before the next paycheque.</li>
            <li>Reserve for savings goals (emergency fund, debt snowball, etc.).</li>
            <li>Whatever remains is discretionary spending—guilt-free.</li>
          </ul>

          <h4>c) Goal-Based Buckets</h4>
          <p>
            <strong>Why it works:</strong> Named sub-accounts ("Paris trip", "Laptop upgrade") leverage the psychology
            of mental accounting.
          </p>
          <p>
            <strong>Tip:</strong> Most banks now let you open multiple no-fee savings "spaces". Automate transfers the
            day after payday.
          </p>

          <h4>d) Feedback Loops</h4>
          <p>
            <strong>Principle:</strong> Plans should flex with real life—medical bill? Overtime pay? Adapt.
          </p>
          <p>
            <strong>Tool-agnostic tactic:</strong> Review buckets weekly; re-route overflow or replenish shortfalls so
            the system stays realistic.
          </p>

          <h3>Key Takeaway</h3>
          <p>
            Build—or choose—a tool that ticks these boxes and you'll move from passive awareness to proactive control.
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
