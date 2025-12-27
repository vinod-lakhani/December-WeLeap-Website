import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"

export default function CreditScoreMythsPage() {
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
              Oct 20, 2025
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
            Credit Score Myths Debunked: What Really Matters
          </h1>

          <p className={cn(TYPOGRAPHY.body, "text-gray-600 leading-relaxed mb-6 md:mb-8")}>
            Separate fact from fiction and learn what actually impacts your credit score—and what doesn't.
          </p>

          <div className="my-6 md:my-8">
            <img
              src="/credit-score-chart-myths.jpg"
              alt="Credit score chart debunking common myths"
              className="w-full rounded-lg shadow-lg"
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
                Your credit score—those three magical digits—can determine whether you get approved for an apartment, car
                loan, or mortgage, and at what interest rate. Despite its importance, credit scores are surrounded by
                myths, misconceptions, and straight-up bad advice. Let's separate fact from fiction and understand what
                really moves the needle on your credit score.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>First: How Credit Scores Actually Work</h2>

              <p>
                Your FICO credit score (the most common) ranges from 300 to 850 and is calculated based on five key
                factors:
              </p>

              <div className="bg-gray-50 p-4 md:p-6 rounded-lg my-6 md:my-8">
                <ul className={cn("space-y-3", TYPOGRAPHY.body, "text-gray-700")}>
                  <li>
                    <strong>Payment History (35%):</strong> Do you pay bills on time?
                  </li>
                  <li>
                    <strong>Credit Utilization (30%):</strong> How much of your available credit are you using?
                  </li>
                  <li>
                    <strong>Length of Credit History (15%):</strong> How long have you had credit accounts?
                  </li>
                  <li>
                    <strong>Credit Mix (10%):</strong> Do you have different types of credit (cards, loans, etc.)?
                  </li>
                  <li>
                    <strong>New Credit (10%):</strong> How many recent credit applications have you made?
                  </li>
                </ul>
              </div>

              <p>Now, let's bust some common myths.</p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                Myth #1: Checking Your Credit Score Hurts It
              </h2>

              <p>
                <strong className="text-red-600">❌ FALSE</strong>
              </p>

              <p>
                Checking your own credit score is a "soft inquiry" and has zero impact on your score. In fact, you should
                check it regularly to monitor for errors or fraud. What does hurt your score? "Hard inquiries" from
                lenders when you apply for credit (but even these only have a small, temporary impact).
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                Myth #2: Closing Old Credit Cards Improves Your Score
              </h2>

              <p>
                <strong className="text-red-600">❌ FALSE</strong>
              </p>

              <p>
                Closing credit cards can actually hurt your score in two ways: (1) it reduces your total available credit,
                increasing your credit utilization ratio, and (2) it shortens your credit history length. Unless the card
                has an annual fee you can't justify, keep old cards open—even if you barely use them.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                Myth #3: You Need to Carry a Credit Card Balance to Build Credit
              </h2>

              <p>
                <strong className="text-red-600">❌ FALSE</strong>
              </p>

              <p>
                This is one of the most expensive myths. You don't need to pay interest to build credit. Pay off your
                balance in full every month. Your credit score benefits from having accounts and using them
                responsibly—not from carrying debt and paying interest.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>Myth #4: Income Affects Your Credit Score</h2>

              <p>
                <strong className="text-red-600">❌ FALSE</strong>
              </p>

              <p>
                Your salary, net worth, or bank account balance don't directly impact your credit score. Credit scoring
                models only look at your borrowing and repayment behavior. That said, income matters when lenders evaluate
                your loan applications—but it's not part of your score calculation.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>Myth #5: All Debt Is Bad for Your Credit</h2>

              <p>
                <strong className="text-red-600">❌ FALSE</strong>
              </p>

              <p>
                Not all debt is created equal. Having a mix of credit types (credit cards, student loans, car loans,
                mortgage) can actually help your score, as long as you manage them responsibly. The key is keeping
                balances manageable and never missing payments.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                Myth #6: Paying Off a Loan Immediately Boosts Your Score
              </h2>

              <p>
                <strong className="text-red-600">❌ PARTIALLY FALSE</strong>
              </p>

              <p>
                While paying off debt is financially smart, it doesn't always immediately boost your score. In fact,
                closing an installment loan (like a car loan) can sometimes cause a small, temporary dip because you're
                losing an active credit account. Don't let this stop you from paying off debt—the long-term benefit far
                outweighs any short-term score fluctuation.
              </p>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>
                What Actually DOES Improve Your Credit Score
              </h2>

              <p>
                Now that we've cleared up the myths, here's what you should actually focus on:
              </p>

              <div className="space-y-4 md:space-y-6 my-6 md:my-8">
                <div className="border-l-4 border-green-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>✅ Pay All Bills On Time, Every Time</h4>
                  <p>
                    Payment history is 35% of your score. Even one missed payment can drop your score significantly. Set
                    up autopay for minimum payments to avoid this.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>✅ Keep Credit Utilization Below 30%</h4>
                  <p>
                    If your credit limit is $10,000, keep your balance below $3,000. Lower is even better—ideally under
                    10%. High utilization signals financial stress to lenders.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>✅ Become an Authorized User</h4>
                  <p>
                    If someone with good credit adds you as an authorized user on their card, their positive payment
                    history can help build your score—even if you never use the card.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>✅ Dispute Errors on Your Credit Report</h4>
                  <p>
                    Check your credit report annually (free at AnnualCreditReport.com) and dispute any errors. Incorrect
                    late payments or accounts that aren't yours can drag down your score.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4 md:pl-6">
                  <h4 className={cn("text-xl font-semibold text-gray-900 mb-2", TYPOGRAPHY.h3)}>✅ Be Patient</h4>
                  <p>
                    Building great credit takes time. There's no quick fix. Consistent, responsible behavior over months
                    and years is what creates an excellent score.
                  </p>
                </div>
              </div>

              <h2 className={cn(TYPOGRAPHY.h2, "text-gray-900 mt-8 md:mt-10 mb-4")}>The Bottom Line</h2>

              <p>
                Don't fall for credit score myths that cost you money or hurt your financial progress. The formula is
                simpler than you think: pay on time, keep utilization low, maintain old accounts, and be patient. Your
                credit score isn't a mystery—it's a reflection of your financial habits.
              </p>

              <div className="bg-primary-50 p-6 md:p-8 rounded-lg my-6 md:my-8">
                <h3 className={cn(TYPOGRAPHY.h3, "text-gray-900 mb-4")}>Your Takeaway</h3>
                <p>
                  Understanding how credit really works empowers you to make smart decisions and avoid costly mistakes.
                  Focus on what actually matters: payment history and credit utilization. Ignore the noise, and watch your
                  score climb.
                </p>
              </div>

              <p className="font-semibold">
                👉 Want to build healthy credit habits effortlessly? Join the WeLeap waitlist at www.weleap.ai and let us
                help you optimize your financial future.
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
