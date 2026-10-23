'use client';

/**
 * "Your first move" — the rent decision stated as one number, and the ask.
 *
 * WHY THIS IS ITS OWN COMPONENT. It used to live inline in RentTool's results
 * block, which renders only after the form is submitted — and submitting needs
 * a start date, a field that is empty by default and was never in the ad. So
 * on a campaign landing this card, and the only link to the app on the page,
 * did not exist. Measured 13 to 15 Oct: 166 paid visits to the rent tool, zero
 * form submissions, zero CTA clicks. Not a placement problem — there was no
 * button to place.
 *
 * RentCampaignHero already computes take-home and the rent range client-side,
 * without the tax API and without a start date, so it has everything this card
 * needs. Extracting it lets the hero show the strongest thing on the page
 * immediately, rather than building a weaker parallel CTA beside it.
 *
 * The numbers are the real decision in front of the person — the spread
 * between the low and high end of their own range — not a generic "we'll build
 * you a plan". They are already computed; showing them is what makes signing
 * up concrete.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { rentFirstMove } from '@/lib/rent';

export interface RentFirstMoveProps {
  /** Low end of their rent range — the cheaper lease. */
  rentRangeLow: number;
  /** High end — what they would otherwise stretch to. */
  rentRangeHigh: number;
  /** Fires the CTA. Owned by the caller so each surface reports its own placement. */
  onCtaClick: () => void;
  formatCurrency: (n: number) => string;
}

export function RentFirstMove({
  rentRangeLow,
  rentRangeHigh,
  onCtaClick,
  formatCurrency,
}: RentFirstMoveProps) {
  const { monthlySaving: leapMonthly, thirtyYearValue: leapThirtyYear } = rentFirstMove(rentRangeLow, rentRangeHigh);

  return (
    <Card className="border-2 border-[#3F6B42] bg-[#F3F7F3] shadow-sm">
      <CardContent className="space-y-4 py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3F6B42]">Your first move</p>
        <h3 className="text-xl font-bold text-[#111827]">
          Rent at {formatCurrency(rentRangeLow)} instead of {formatCurrency(rentRangeHigh)} and you free up{' '}
          <span className="text-[#3F6B42]">{formatCurrency(leapMonthly)}/mo</span>.
        </h3>

        {leapThirtyYear > 0 && (
          <div className="rounded-2xl border border-[#3F6B42]/25 bg-white px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
              Hypothetical: what that could grow to
            </p>
            <p className="mt-1 text-[30px] font-extrabold leading-none tabular-nums text-[#111827]">
              {formatCurrency(leapThirtyYear)}
            </p>
            {/* The assumptions are the ones rentFirstMove uses: the monthly amount invested every month for
                30 years at REAL_RETURN_DEFAULT (7%, after inflation), compounded monthly. Stated in full
                because a projection shown without them reads as a promise. */}
            <p className="mt-1.5 text-xs text-gray-500">
              Illustration only: {formatCurrency(leapMonthly)} invested every month for 30 years at a 7% average
              yearly return after inflation. Not a guarantee; investments can lose value.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-700">
          That&apos;s the whole decision. Left alone it disappears into everyday spending — WeLeap gives it a job
          first.
        </p>

        <div>
          <Button
            onClick={onCtaClick}
            className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90 sm:w-auto"
          >
            {/* Not "Track my $350/mo". Two problems with that: the $350 does
                not exist yet — it is conditional on signing the cheaper lease
                — and "track" is the budgeting-app verb this product spends a
                comparison table on /tools distancing itself from. This
                completes the sentence directly above it and leaves the loop
                open: the tool found the money, the app decides where it goes. */}
            {leapMonthly > 0
              ? `Show me where my ${formatCurrency(leapMonthly)}/mo should go →`
              : 'Create my free account →'}
          </Button>
          <p className="mt-2 text-xs text-gray-500">Free · 2 minutes · No credit card.</p>
        </div>
      </CardContent>
    </Card>
  );
}
