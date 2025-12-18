import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

export default function CreditScoreMythsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Article Header */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Jan 22, 2024
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />7 min read
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Jessica Park
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Credit Score Myths Debunked: What Really Matters
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Separate fact from fiction and learn what actually impacts your credit score—and what doesn't.
            </p>

            <div className="my-8 -mx-4 md:mx-0">
              <img
                src="/credit-score-chart-myths.jpg"
                alt="Credit score chart debunking common myths"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              Your credit score—those three magical digits—can determine whether you get approved for an apartment, car
              loan, or mortgage, and at what interest rate. Despite its importance, credit scores are surrounded by
              myths, misconceptions, and straight-up bad advice. Let's separate fact from fiction and understand what
              really moves the needle on your credit score.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">First: How Credit Scores Actually Work</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Your FICO credit score (the most common) ranges from 300 to 850 and is calculated based on five key
              factors:
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <ul className="space-y-3 text-gray-700">
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

            <p className="text-gray-700 leading-relaxed mb-8">Now, let's bust some common myths.</p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              Myth #1: Checking Your Credit Score Hurts It
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Checking your own credit score is a "soft inquiry" and has zero impact on your score. In fact, you should
              check it regularly to monitor for errors or fraud. What does hurt your score? "Hard inquiries" from
              lenders when you apply for credit (but even these only have a small, temporary impact).
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              Myth #2: Closing Old Credit Cards Improves Your Score
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Closing credit cards can actually hurt your score in two ways: (1) it reduces your total available credit,
              increasing your credit utilization ratio, and (2) it shortens your credit history length. Unless the card
              has an annual fee you can't justify, keep old cards open—even if you barely use them.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              Myth #3: You Need to Carry a Credit Card Balance to Build Credit
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              This is one of the most expensive myths. You don't need to pay interest to build credit. Pay off your
              balance in full every month. Your credit score benefits from having accounts and using them
              responsibly—not from carrying debt and paying interest.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Myth #4: Income Affects Your Credit Score</h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Your salary, net worth, or bank account balance don't directly impact your credit score. Credit scoring
              models only look at your borrowing and repayment behavior. That said, income matters when lenders evaluate
              your loan applications—but it's not part of your score calculation.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Myth #5: All Debt Is Bad for Your Credit</h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Not all debt is created equal. Having a mix of credit types (credit cards, student loans, car loans,
              mortgage) can actually help your score, as long as you manage them responsibly. The key is keeping
              balances manageable and never missing payments.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              Myth #6: Paying Off a Loan Immediately Boosts Your Score
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-600">❌ PARTIALLY FALSE</strong>
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              While paying off debt is financially smart, it doesn't always immediately boost your score. In fact,
              closing an installment loan (like a car loan) can sometimes cause a small, temporary dip because you're
              losing an active credit account. Don't let this stop you from paying off debt—the long-term benefit far
              outweighs any short-term score fluctuation.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">
              What Actually DOES Improve Your Credit Score
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Now that we've cleared up the myths, here's what you should actually focus on:
            </p>

            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">✅ Pay All Bills On Time, Every Time</h4>
                <p className="text-gray-700 leading-relaxed">
                  Payment history is 35% of your score. Even one missed payment can drop your score significantly. Set
                  up autopay for minimum payments to avoid this.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">✅ Keep Credit Utilization Below 30%</h4>
                <p className="text-gray-700 leading-relaxed">
                  If your credit limit is $10,000, keep your balance below $3,000. Lower is even better—ideally under
                  10%. High utilization signals financial stress to lenders.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">✅ Become an Authorized User</h4>
                <p className="text-gray-700 leading-relaxed">
                  If someone with good credit adds you as an authorized user on their card, their positive payment
                  history can help build your score—even if you never use the card.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">✅ Dispute Errors on Your Credit Report</h4>
                <p className="text-gray-700 leading-relaxed">
                  Check your credit report annually (free at AnnualCreditReport.com) and dispute any errors. Incorrect
                  late payments or accounts that aren't yours can drag down your score.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">✅ Be Patient</h4>
                <p className="text-gray-700 leading-relaxed">
                  Building great credit takes time. There's no quick fix. Consistent, responsible behavior over months
                  and years is what creates an excellent score.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">The Bottom Line</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Don't fall for credit score myths that cost you money or hurt your financial progress. The formula is
              simpler than you think: pay on time, keep utilization low, maintain old accounts, and be patient. Your
              credit score isn't a mystery—it's a reflection of your financial habits.
            </p>

            <div className="bg-primary-50 p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your Takeaway</h3>
              <p className="text-gray-700 leading-relaxed">
                Understanding how credit really works empowers you to make smart decisions and avoid costly mistakes.
                Focus on what actually matters: payment history and credit utilization. Ignore the noise, and watch your
                score climb.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed font-semibold">
              👉 Want to build healthy credit habits effortlessly? Join the WeLeap waitlist at www.weleap.ai and let us
              help you optimize your financial future.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
