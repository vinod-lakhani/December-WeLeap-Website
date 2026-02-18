'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AssumptionsAccordionProps {
  taxSource: 'api_ninjas' | 'fallback';
}

export function AssumptionsAccordion({ taxSource }: AssumptionsAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="assumptions" className="border-[#D1D5DB]">
        <AccordionTrigger className="text-[#111827] hover:no-underline">
          How we figure it
        </AccordionTrigger>
        <AccordionContent className="text-sm text-[#111827]/80 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Tax Calculation</h4>
            <p>
              {taxSource === 'api_ninjas' 
                ? 'Tax estimates based on API Ninjas Income Tax Calculator for 2026 tax year.'
                : 'Tax estimates based on conservative effective tax rates (fallback method used).'}
            </p>
            <p className="mt-2 text-xs text-[#111827]/60">
              Federal, state, and FICA taxes included. Actual taxes may vary based on deductions,
              filing status, and other factors.
            </p>
          </div>

          <div className="border-t border-[#D1D5DB] pt-4">
            <h4 className="font-semibold mb-2">How we get your rent range</h4>
            <p>
              Your rent range is a rule of thumb: 28–35% of your monthly take-home (after taxes and
              debt). Housing usually shouldn't eat more than about one-third of what you bring home.
            </p>
          </div>

          <div className="border-t border-[#D1D5DB] pt-4">
            <h4 className="font-semibold mb-2">Factoring in debt</h4>
            <p>
              If you add monthly debt payments, we subtract those from your take-home before we get
              your rent range. That way your rent budget already accounts for what you owe.
            </p>
          </div>

          <div className="border-t border-[#D1D5DB] pt-4">
            <h4 className="font-semibold mb-2">Disclaimer</h4>
            <p className="text-xs text-[#111827]/60">
              These are educational estimates only and do not constitute financial advice. Individual
              circumstances vary, and you should consult with a financial advisor for personalized
              guidance.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
