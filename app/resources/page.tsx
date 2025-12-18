import { Navigation } from "../../components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, TrendingUp, DollarSign, PiggyBank, CreditCard } from "lucide-react"
import Link from "next/link"

const blogPosts = [
  {
    id: 1,
    title: "The Rent-Check Panic: Why Budgeting Isn’t Enough (And What to Do Instead)",
    excerpt:
      "Learn why this happens and how to restructure your money habits for lasting control. This common experience has less to do with budgeting skills and more to do with how money flows through your life.",
    author: "Vinod Lakhani",
    date: "Jan 15, 2024",
    readTime: "5 min read",
    category: "Saving",
    icon: PiggyBank,
    image: "/images/rent-check-panic.jpeg",
    href: "/resources/the-rent-check-panic", // Updated href
  },
  {
    id: 2,
    title: "Financial Autopilot Isn’t Lazy — It’s Smart",
    excerpt:
      "True automation turns your priorities into rules that run in the background, freeing up brain-space while staying aligned with your goals. Learn how to build a system that works for you.",
    author: "Vinod Lakhani",
    date: "Jan 12, 2024",
    readTime: "8 min read",
    category: "Investing",
    icon: TrendingUp,
    image: "/images/financial-autopilot.jpg",
    href: "/resources/financial-autopilot", // Updated to new page
  },
  {
    id: 3,
    title: "From Awareness to Action: Escaping the Passive Budgeting Trap",
    excerpt:
      "You checked your budget, saw the pie chart, nodded in recognition—and kept spending the same way. Break free from passive budgeting and turn financial awareness into real action.", // Changed excerpt
    author: "Vinod Lakhani",
    date: "Jan 10, 2024",
    readTime: "6 min read",
    category: "Emergency Planning",
    icon: DollarSign,
    image: "/images/awareness-to-action.jpg",
    href: "/resources/awareness-to-action", // Updated to new page
  },
  {
    id: 4,
    title: "The Adaptable Money System: Stop Budgeting, Start Building",
    excerpt: "Why rigid budgets fail and how you can grow wealth with a dynamic approach.",
    author: "David Park",
    date: "Jan 8, 2024",
    readTime: "7 min read",
    category: "Credit",
    icon: CreditCard,
    image: "/images/adaptable-money-system-thumbnail.png",
    href: "/resources/adaptable-money-system",
  },
  {
    id: 5,
    title: "Why Traditional Financial Tools Fail Builders",
    excerpt:
      "Explore the behavioral patterns that lead to poor financial choices and learn strategies to overcome emotional spending.",
    author: "Dr. Lisa Wang",
    date: "Jan 5, 2024",
    readTime: "10 min read",
    category: "Psychology",
    icon: TrendingUp,
    image: "/images/traditional-tools-fail.png", // Updated image to Plan-Act-Adapt illustration
    href: "/resources/traditional-tools-fail",
  },
  {
    id: 6,
    title: "Income Allocation: The Blueprint to Make Your Paycheck Work Smarter",
    excerpt: "Tired of feeling behind? Learn the simple system to turn your income into a wealth-building engine.",
    author: "Robert Kim",
    date: "Jan 3, 2024",
    readTime: "9 min read",
    category: "Retirement",
    icon: PiggyBank,
    image: "/images/income-allocation-resources.png",
    href: "/resources/income-allocation",
  },
  {
    id: 7,
    title: "Savings Allocation: How to Grow Your Savings Without Feeling the Pinch",
    excerpt:
      "Build goals into your plan and let automation make it painless. Learn the priority stack for strategic savings allocation.",
    author: "Dr. Sarah Chen",
    date: "Jan 15, 2024",
    readTime: "8 min read",
    category: "Saving",
    icon: PiggyBank,
    image: "/images/image.png", // Updated to use exact image URL provided by user
    href: "/resources/psychology-of-spending",
  },
  {
    id: 8,
    title: "Building Your Emergency Fund: A Step-by-Step Guide",
    excerpt:
      "Learn how to build a safety net that protects you from life's unexpected expenses without derailing your financial goals.",
    author: "Michael Torres",
    date: "Dec 20, 2024",
    readTime: "6 min read",
    category: "Emergency Planning",
    icon: DollarSign,
    image: "/safety-net-financial-security.jpg",
    href: "/resources/emergency-fund-guide",
  },
  {
    id: 9,
    title: "Credit Score Myths Debunked: What Really Matters",
    excerpt:
      "Cut through the misinformation and learn what actually impacts your credit score and how to improve it strategically.",
    author: "Jennifer Martinez",
    date: "Dec 15, 2024",
    readTime: "8 min read",
    category: "Credit",
    icon: CreditCard,
    image: "/credit-score-chart-myths.jpg",
    href: "/resources/credit-score-myths",
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-40 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Financial <span className="text-primary-600">Resources</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Expert insights, practical tips, and actionable advice to help you make smarter financial decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <Link href="/resources/featured-article" className="block">
              {" "}
              {/* Wrap the entire card with Link */}
              <Card className="bg-gradient-to-r from-primary-600 to-primary-700 border-0 rounded-3xl overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-12 text-white">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Featured
                        </span>
                        <span className="text-white/80 text-sm">6 min read</span>
                      </div>
                      <div className="text-white/80 text-sm mb-4">By Vinod Lakhani</div>
                      <h2 className="text-3xl font-bold mb-4 group-hover:underline">
                        Real Finance for Real Life: Why We Built WeLeap
                      </h2>
                      <p className="text-white/90 mb-6 leading-relaxed">
                        We didn’t set out to build another budgeting app. We built WeLeap because the system is broken —
                        and it’s failing the very people it claims to serve.
                      </p>
                      <Button
                        asChild // Use asChild to render Link inside Button
                        className="inline-flex items-center justify-center bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-medium"
                      >
                        {/* The Link is now on the parent Card, so this button just acts as a visual cue */}
                        <span>
                          Read Article
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                      </Button>
                    </div>
                    <div className="relative min-h-[300px] md:min-h-[400px]">
                      <img
                        src="/images/financial-growth.jpeg"
                        alt="Plant growing from coins, symbolizing financial growth"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => {
                const IconComponent = post.icon
                return (
                  <Link href={post.href} key={post.id}>
                    {" "}
                    {/* Wrap card with Link */}
                    <Card className="bg-white border-0 shadow-lg shadow-gray-900/5 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4">
                            <div className="bg-primary-100 rounded-lg p-2">
                              <IconComponent className="w-5 h-5 text-primary-600" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {post.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.readTime}
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-200">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-4 leading-relaxed">{post.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{post.author}</span>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-xl text-gray-600 mb-8">
              Get the latest financial tips and insights delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium">
                Subscribe
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
