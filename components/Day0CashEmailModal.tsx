'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { track } from '@/lib/analytics';
import type { Variant } from '@/lib/abTest';

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
}

interface Day0CashEmailModalProps {
  variant: Variant;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmitted: () => void;
  planData: PlanData;
}

export function Day0CashEmailModal({
  variant,
  isOpen,
  onOpenChange,
  onEmailSubmitted,
  planData,
}: Day0CashEmailModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Track modal open
  const handleOpenChange = (open: boolean) => {
    if (open && isOpen === false) {
      // Modal is opening
      track('day0_cash_email_modal_open', {
        ab_day0_cash_variant: variant,
      });
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Track email submission
      track('day0_cash_email_submit', {
        ab_day0_cash_variant: variant,
      });

      // Use the same API endpoint as WaitlistForm to send email and save to Google Sheets
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

      // Success - mark as submitted
      setIsSubmitted(true);
      
      // Clear email and close modal after a brief delay
      setTimeout(() => {
        setEmail('');
        onOpenChange(false);
        setIsSubmitted(false);
        // Trigger reveal callback
        onEmailSubmitted();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Get your Day-0 Cash Plan
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Enter your email to see the exact amount you'll need upfront, plus a breakdown of where it goes.
          </DialogDescription>
        </DialogHeader>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="day0-email" className="text-gray-700">
                Email address
              </Label>
              <Input
                id="day0-email"
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
              {isLoading ? 'Sending...' : 'Get my plan'}
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
}
