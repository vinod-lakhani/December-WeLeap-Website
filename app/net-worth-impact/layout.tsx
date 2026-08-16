import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Is $150 a month worth it? See the 30-year impact',
  alternates: { canonical: '/net-worth-impact' },
  description:
    'Small moves compound. See how one monthly change ($/mo) changes your future net worth at 1, 10, and 30 years. Investing, cash, or debt payoff.',
};

export default function NetWorthImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
