'use client'

import type React from 'react'
import { cn } from '@/lib/utils'

// Shared by the offer and first-paycheck tools: the example-term question and the one-line answer.

/**
 * The question a term opens with while nobody has said what the offer (or plan) has. The example value is in the question,
 * so "Yes" says what it confirms, and the controls stay hidden until "Different" asks for them: a slider set to
 * the example read as decoration, and leaving it alone meant the term never counted (see enteredOfferInputs).
 */
export function TermQuestion({ question, differentLabel, noLabel, onYes, onDifferent, onNo }: {
  question: React.ReactNode; differentLabel: string; noLabel: string;
  onYes: () => void; onDifferent: () => void; onNo: () => void;
}) {
  const btn = 'min-h-11 rounded-lg px-2 text-[13.5px] font-bold leading-tight transition';
  return (
    <div>
      <p className="text-[15px] font-semibold leading-snug text-gray-800">{question}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={onYes} className={cn(btn, 'border-2 border-[#386641] bg-[#386641] text-white hover:bg-[#2d5a26]')}>Yes</button>
        <button type="button" onClick={onDifferent} className={cn(btn, 'border-2 border-[#386641] bg-white text-[#386641] hover:bg-[#386641]/5')}>{differentLabel}</button>
        <button type="button" onClick={onNo} className={cn(btn, 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400')}>{noLabel}</button>
      </div>
    </div>
  );
}

/** An answered term: what the offer has, in one line, and an obvious way back to the question. */
export function TermSummary({ label, children, onChange }: { label: React.ReactNode; children: React.ReactNode; onChange: () => void }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-[15px] leading-snug text-gray-800">
        <span className="font-semibold">{label}:</span> {children}
      </p>
      <button type="button" onClick={onChange}
        className="-my-2 inline-flex min-h-11 shrink-0 items-center text-[14px] font-bold text-brand-700 underline underline-offset-4">
        Change
      </button>
    </div>
  );
}
