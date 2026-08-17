import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd'
import { toolSchema, toolByHref } from '@/lib/structured-data'

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

export default function NetWorthImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tool = toolByHref('/net-worth-impact')
  return (
    <>
      {/* WebApplication markup for this calculator, derived from the
          tools registry so it cannot drift from the card copy. The helpers
          were imported here but never called, so this was the one tool route
          shipping no structured data. */}
      {tool && <JsonLd data={toolSchema(tool)} />}
      {children}
    </>
  );
}
