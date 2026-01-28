'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencySigned } from '@/lib/format';
import { cn } from '@/lib/utils';

interface NumberCardProps {
  years: number;
  impact: number;
  sentence: string;
  className?: string;
}

export function NumberCard({ years, impact, sentence, className }: NumberCardProps) {
  const title = years === 1 ? 'In 1 year' : `In ${years} years`;

  return (
    <Card className={cn('border-gray-200 bg-white', className)}>
      <CardContent className="p-5 md:p-6">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </p>
        <p
          className={cn(
            'text-2xl md:text-3xl font-bold tabular-nums mb-2',
            impact >= 0 ? 'text-[#111827]' : 'text-red-600'
          )}
        >
          {formatCurrencySigned(impact)}
        </p>
        <p className="text-sm md:text-base text-gray-700 leading-snug">{sentence}</p>
      </CardContent>
    </Card>
  );
}
