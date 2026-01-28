import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Net Worth Impact | WeLeap',
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
