/**
 * The /resources articles, in one place.
 *
 * Same reasoning as lib/tools.ts. The article data existed twice — once as a
 * `blogPosts` array on /resources driving the cards, once as prose inside each
 * article page — and the two had already drifted: /resources advertised the
 * emergency fund guide as a 6-minute read against the article's own 10, and the
 * credit score piece as 8 against its own 7. Nothing joined them, so nothing
 * caught it.
 *
 * Adding BlogPosting markup to twelve pages by hand would have made that three
 * copies. This is the single source: /resources renders the cards from it, and
 * each article page emits its own schema from it.
 *
 * `datePublished` is the date printed on the article itself, in ISO form.
 * `featured-article` prints no date and therefore has none here — a null that
 * suppresses `datePublished` in the schema rather than a guess that would put a
 * fabricated publication date in front of Google.
 */

export interface Article {
  /** Route. The key everything joins on. */
  href: string
  /** Headline, as it appears on the card and in the schema. */
  title: string
  /** Card copy. Longer and more specific than `description`. */
  excerpt: string
  /** Meta description, and the schema description. */
  description: string
  /** ISO 8601 date from the byline printed on the article, or null if it has none. */
  datePublished: string | null
  author: string
  /** Reading time in minutes, as stated on the article itself. */
  readMinutes: number
  /** Card image, also used as the schema image. Site-root-relative. */
  image: string
  /** Card category chip. */
  category: string
  /** Lucide icon name; mapped to a component in the page that renders it. */
  icon: 'PiggyBank' | 'TrendingUp' | 'DollarSign' | 'CreditCard' | 'Wallet'
  /** The one article promoted at the top of /resources, and excluded from the grid. */
  featured?: true
}

export const ARTICLES: readonly Article[] = [
  {
    href: '/resources/featured-article',
    title: 'Real Finance for Real Life: Why We Built WeLeap',
    excerpt:
      "We didn't set out to build another budgeting app. We built WeLeap because the system is broken — and it's failing the very people it claims to serve.",
    description: 'A closer look at one money decision worth getting right.',
    datePublished: '2025-12-18',
    author: 'Vinod Lakhani',
    readMinutes: 6,
    image: '/images/financial-growth.jpeg',
    category: 'Company',
    icon: 'TrendingUp',
    featured: true,
  },
  {
    href: '/resources/income-allocation',
    title: 'Income Allocation: The Blueprint to Make Your Paycheck Work Smarter',
    excerpt: 'Tired of feeling behind? Learn the simple system to turn your income into a wealth-building engine.',
    description:
      'Needs, wants and savings is a starting point, not an answer. How to allocate income when you have a surplus.',
    datePublished: '2025-05-03',
    author: 'Vinod Lakhani',
    readMinutes: 9,
    image: '/images/income-allocation-resources.jpg',
    category: 'Retirement',
    icon: 'PiggyBank',
  },
  {
    href: '/resources/psychology-of-spending',
    title: 'Savings Allocation: How to Grow Your Savings Without Feeling the Pinch',
    excerpt:
      'Build goals into your plan and let automation make it painless. Learn the priority stack for strategic savings allocation.',
    description:
      'Why the same amount feels different depending on how you pay, and what that costs you.',
    datePublished: '2025-05-09',
    author: 'Vinod Lakhani',
    readMinutes: 8,
    image: '/images/image.png',
    category: 'Saving',
    icon: 'PiggyBank',
  },
  {
    href: '/resources/traditional-tools-fail',
    title: 'Why Traditional Financial Tools Fail Builders',
    excerpt:
      'Explore the behavioral patterns that lead to poor financial choices and learn strategies to overcome emotional spending.',
    description:
      'Budgeting apps tell you what happened. They almost never tell you what to do next.',
    datePublished: '2025-05-24',
    author: 'Vinod Lakhani',
    readMinutes: 10,
    image: '/images/traditional-tools-fail.png',
    category: 'Psychology',
    icon: 'TrendingUp',
  },
  {
    href: '/resources/adaptable-money-system',
    title: 'The Adaptable Money System: Stop Budgeting, Start Building',
    excerpt: 'Why rigid budgets fail and how you can grow wealth with a dynamic approach.',
    description:
      'Budgets break the moment life changes. A system that adapts survives the raise, the move and the bad month.',
    datePublished: '2025-06-14',
    author: 'Vinod Lakhani',
    readMinutes: 7,
    image: '/images/adaptable-money-system-thumbnail.jpg',
    category: 'Credit',
    icon: 'CreditCard',
  },
  {
    href: '/resources/awareness-to-action',
    title: 'From Awareness to Action: Escaping the Passive Budgeting Trap',
    excerpt:
      'You checked your budget, saw the pie chart, nodded in recognition—and kept spending the same way. Break free from passive budgeting and turn financial awareness into real action.',
    description:
      'Knowing where your money goes changes nothing on its own. What turns awareness into a decision.',
    datePublished: '2025-07-07',
    author: 'Vinod Lakhani',
    readMinutes: 6,
    image: '/images/awareness-to-action.jpg',
    category: 'Emergency Planning',
    icon: 'DollarSign',
  },
  {
    href: '/resources/financial-autopilot',
    title: "Financial Autopilot Isn't Lazy — It's Smart",
    excerpt:
      'True automation turns your priorities into rules that run in the background, freeing up brain-space while staying aligned with your goals. Learn how to build a system that works for you.',
    description:
      'The decisions worth automating, the ones worth keeping manual, and how to tell them apart.',
    datePublished: '2025-07-28',
    author: 'Vinod Lakhani',
    readMinutes: 8,
    image: '/images/financial-autopilot.jpg',
    category: 'Investing',
    icon: 'TrendingUp',
  },
  {
    href: '/resources/the-rent-check-panic',
    title: "The Rent-Check Panic: Why Budgeting Isn't Enough (And What to Do Instead)",
    excerpt:
      'Learn why this happens and how to restructure your money habits for lasting control. This common experience has less to do with budgeting skills and more to do with how money flows through your life.',
    description:
      'The gap between signing a lease and realising what it left you — and how to see it before you sign.',
    datePublished: '2025-08-18',
    author: 'Vinod Lakhani',
    readMinutes: 5,
    image: '/images/rent-check-panic.jpeg',
    category: 'Saving',
    icon: 'PiggyBank',
  },
  {
    href: '/resources/emergency-fund',
    title: 'Building Your Emergency Fund: A Step-by-Step Guide',
    excerpt:
      "Learn how to build a safety net that protects you from life's unexpected expenses without derailing your financial goals.",
    description:
      'What it is for, how big it should be, where to keep it, and when to stop adding to it.',
    datePublished: '2025-09-30',
    author: 'Vinod Lakhani',
    // The article's own byline says 10; the /resources card used to say 6.
    readMinutes: 10,
    image: '/safety-net-financial-security.jpg',
    category: 'Emergency Planning',
    icon: 'DollarSign',
  },
  {
    href: '/resources/credit-score-myths',
    title: 'Credit Score Myths Debunked: What Really Matters',
    excerpt:
      'Cut through the misinformation and learn what actually impacts your credit score and how to improve it strategically.',
    description: 'The advice that sounds sensible, is repeated everywhere, and is quietly wrong.',
    datePublished: '2025-10-20',
    author: 'Vinod Lakhani',
    // The article's own byline says 7; the /resources card used to say 8.
    readMinutes: 7,
    image: '/credit-score-chart-myths.jpg',
    category: 'Credit',
    icon: 'CreditCard',
  },
  {
    href: '/resources/emergency-fund-guess',
    title: "Most people don't have an emergency fund. They have a guess.",
    excerpt:
      'Why clarity—not just a number—changes everything. See your path, not just the target.',
    description:
      'Three months, six months — the standard advice ignores the two things that actually decide your number.',
    datePublished: '2026-03-21',
    author: 'Vinod Lakhani',
    readMinutes: 5,
    image: '/images/emergency-fund-illustration.png',
    category: 'Emergency Planning',
    icon: 'DollarSign',
  },
]

export const FEATURED_ARTICLE = ARTICLES.find((a) => a.featured)!
export const GRID_ARTICLES = ARTICLES.filter((a) => !a.featured)

/** Look an article up by its route, for use inside that route's page. */
export function articleByHref(href: string): Article | undefined {
  return ARTICLES.find((a) => a.href === href)
}

/**
 * "Aug 18, 2025" from "2025-08-18".
 *
 * Pinned to UTC: a bare YYYY-MM-DD parses as midnight UTC, and formatting that
 * in a timezone behind UTC silently renders the previous day.
 */
export function formatArticleDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
