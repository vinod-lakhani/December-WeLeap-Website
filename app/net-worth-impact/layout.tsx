import type { Metadata } from 'next';
import { ToolJsonLd } from '@/components/ToolJsonLd'

export const metadata: Metadata = {
  title: 'Is $150 a month worth it? See the 30-year impact',
  alternates: { canonical: '/net-worth-impact' },
  description:
    'Small moves compound. See how one monthly change ($/mo) changes your future net worth at 1, 10, and 30 years. Investing, cash, or debt payoff.',
  openGraph: {
    title: 'Is $150 a month worth it? See the 30-year impact | WeLeap',
    description:
      'Small moves compound. See how one monthly change ($/mo) changes your future net worth at 1, 10, and 30 years. Investing, cash, or debt payoff.',
    url: '/net-worth-impact',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WebApplication + FAQPage markup for this route. */}
      <ToolJsonLd href="/net-worth-impact" />
      {children}
    </>
  )
}
