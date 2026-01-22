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

interface Day0CashEmailModalProps {
  variant: Variant;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmitted: () => void;
  upfrontCashLow: number;
  upfrontCashHigh: number;
}

export function Day0CashEmailModal({
  variant,
  isOpen,
  onOpenChange,
  onEmailSubmitted,
  upfrontCashLow,
  upfrontCashHigh,
}: Day0CashEmailModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // For A/B test: Just track the email submission
      // In production, you might want to send this to your email service
      // For now, we'll simulate success to reveal the number
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear email and close modal
      setEmail('');
      onOpenChange(false);
      // Trigger reveal callback
      onEmailSubmitted();
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
      </DialogContent>
    </Dialog>
  );
}
