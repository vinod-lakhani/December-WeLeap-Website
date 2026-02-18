'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { track } from '@/lib/analytics';
import {
  bucketSalary,
  bucketRentRatio,
  bucketDaysUntilStart,
  mapCityToTier,
} from '@/lib/buckets';

interface PlanData {
  salary: string;
  city: string;
  startDate: string;
  debtMonthly?: string;
  takeHomeMonthly: number;
  takeHomeAnnual: number;
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  daysUntilStart: number;
  upfrontCashLow?: number;
  upfrontCashHigh?: number;
  budgetBreakdown?: {
    needs: number;
    wants: number;
    savings: number;
  };
  taxBreakdown?: {
    grossAnnual: number;
    federalTaxAnnual: number;
    stateTaxAnnual: number;
    ficaTaxAnnual: number;
    totalTaxAnnual: number;
    netIncomeAnnual: number;
  };
  // Location context for ZORI
  locationMode?: 'preset' | 'other';
  presetCity?: string;
  stateName?: string;
  regionName?: string;
  zoriAvailable?: boolean;
}

interface WaitlistFormProps {
  planData?: PlanData;
  /** When provided, show Leap CTA as primary and Rent Plan as secondary */
  onLeapClick?: () => void;
  /** Secondary tile: lighter styling, outlined button */
  variant?: 'default' | 'secondary';
}

export function WaitlistForm({ planData, onLeapClick, variant = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/email-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          planData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to send plan';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(errorMsg + details);
      }

      // Track playbook email sent after successful send
      if (planData) {
        const salaryNum = parseFloat(planData.salary);
        const rentMidpoint = (planData.rentRangeLow + planData.rentRangeHigh) / 2;
        
        track('playbook_email_sent', {
          page: '/how-much-rent-can-i-afford',
          tool_version: 'rent_tool_v1',
          salary_bucket: bucketSalary(salaryNum),
          city_tier: mapCityToTier(planData.city),
          days_until_start_bucket: bucketDaysUntilStart(planData.startDate),
          rent_ratio_bucket: bucketRentRatio(rentMidpoint, planData.takeHomeMonthly),
        });
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const secondaryButton = (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={onLeapClick || variant === 'secondary' ? 'outline' : 'default'}
          className={onLeapClick || variant === 'secondary' ? 'border-[#3F6B42] text-[#3F6B42] hover:bg-[#3F6B42]/5' : 'w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'}
        >
          {variant === 'secondary' ? 'Get My Rent Plan (PDF)' : 'Get My Day 1 Rent Plan (PDF)'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Get your plan by email</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Download a clean, one-page plan. We&apos;ll send it to your inbox.
          </DialogDescription>
        </DialogHeader>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#3F6B42] hover:bg-[#3F6B42]/90 text-white px-6 py-3 rounded-xl font-medium mt-2"
            >
              {isLoading ? 'Sending...' : 'Send my plan'}
            </Button>
          </form>
        ) : (
          <div className="py-4 text-center">
            <p className="text-green-600 font-medium mb-2">✓ Plan sent!</p>
            <p className="text-gray-600 text-sm">
              Check your email for your personalized plan PDF.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const isSecondary = variant === 'secondary';

  return (
    <Card className={isSecondary ? 'border border-gray-200 bg-gray-50' : 'border-[#D1D5DB] bg-white'}>
      <CardHeader className={isSecondary ? 'pb-2 pt-4 px-4' : undefined}>
        <CardTitle className={isSecondary ? 'text-lg text-[#111827]' : 'text-xl text-[#111827]'}>
          {isSecondary ? 'Get a 1-page rent plan (PDF)' : 'You earned the salary. Now protect it.'}
        </CardTitle>
      </CardHeader>
      <CardContent className={isSecondary ? 'pt-0 pb-4 px-4' : undefined}>
        <p className="text-sm text-gray-600 mb-4">
          {isSecondary
            ? 'Download a simple summary with your rent range and cash you need upfront.'
            : 'Get a one-page plan with your rent range, cash you need upfront, and a simple money plan starting point. Download a clean, one-page plan.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {onLeapClick && (
            <Button
              onClick={onLeapClick}
              className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
            >
              Build my full money plan (prefilled)
            </Button>
          )}
          {secondaryButton}
        </div>
        {onLeapClick && (
          <p className="text-xs text-gray-500 mt-2">
            Takes ~2 minutes. No email required.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
