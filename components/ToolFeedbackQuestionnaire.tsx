'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

/**
 * The unified answer vocabulary.
 *
 * The component's internal states are yes/not_sure/no because that is what
 * every call site and every legacy per-tool event already uses. `not_relevant`
 * is the reporting name for `no` — "this doesn't apply to me" rather than
 * "this is wrong", which is what the third button has always said on every
 * tool. Mapping it here keeps the widget's history intact while giving the
 * cross-tool event a name that means what it measures.
 */
const ANSWER: Record<'yes' | 'not_sure' | 'no', string> = {
  yes: 'yes',
  not_sure: 'not_sure',
  no: 'not_relevant',
};

interface ToolFeedbackQuestionnaireProps {
  page: string;
  /**
   * FREE_TOOLS slug, for the cross-tool `leap_feedback` event.
   *
   * Every tool already fires its own `*_feedback_submitted`, but under seven
   * different names, so the acceptance rate the concept gate rests on could
   * only be assembled by hand from seven queries. This is the one event that
   * answers it directly. The per-tool events keep firing alongside — their
   * history predates this and reports built on them should not break.
   */
  tool: string;
  /** Analytics event name. Defaults to "rent_tool_feedback_submitted" (rent tool). Use "networth_tool_feedback_submitted" for Net Worth Impact, "leap_impact_feedback_submitted" for Leap Impact. */
  eventName?: string;
  /** Custom question. Default: "Was this helpful?" */
  question?: string;
  /** Custom button labels. Default: { yes: "Yes", not_sure: "Not sure", no: "No" } */
  buttonLabels?: { yes: string; not_sure: string; no: string };
  /** Custom response messages per feedback type. When provided, shown instead of "Thank you for your feedback!" */
  feedbackResponseMessages?: { yes?: string; not_sure?: string; no?: string };
  /** "default" = card with full-width buttons; "inline" = single line with small buttons */
  variant?: 'default' | 'inline';
  /** Extra params merged into track() for A/B tests (e.g. { variant: 'A' }) */
  extraTrackParams?: Record<string, string | number | boolean>;
  onFeedbackSubmitted: (feedback: 'yes' | 'no' | 'not_sure') => void;
}

export function ToolFeedbackQuestionnaire({ page, tool, eventName = 'rent_tool_feedback_submitted', question = 'Was this helpful?', buttonLabels = { yes: 'Yes', not_sure: 'Not sure', no: 'No' }, feedbackResponseMessages, variant = 'default', extraTrackParams, onFeedbackSubmitted }: ToolFeedbackQuestionnaireProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<'yes' | 'no' | 'not_sure' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleFeedbackClick = (feedback: 'yes' | 'no' | 'not_sure') => {
    setSelectedFeedback(feedback);
    setIsSubmitted(true);
    setShowThankYou(true);
    
    // Track feedback submission
    track(eventName, {
      page,
      feedback,
      ...extraTrackParams,
    });

    /**
     * The cross-tool event. `answer` rather than `feedback`, and
     * `not_relevant` rather than `no`, so the name matches what the button
     * actually says.
     *
     * `extraTrackParams` rides along because of the offer tool: its three
     * answers are a DIRECTION (higher / as expected / lower), not a sentiment,
     * and it passes `scale: 'expectation'` to say so. Without that marker
     * here, a blended acceptance rate would read "the offer was worth less
     * than I hoped" as dissatisfaction with the tool.
     */
    track('leap_feedback', {
      tool,
      answer: ANSWER[feedback],
      ...extraTrackParams,
    });
    
    // Call callback (e.g. to scroll to CTA) after showing thank you message
    setTimeout(() => {
      onFeedbackSubmitted(feedback);
      // Hide thank you message after callback (for "No" responses) — skip when using custom progression messages
      if (feedback === 'no' && !feedbackResponseMessages) {
        setTimeout(() => setShowThankYou(false), 500);
      }
    }, 1500); // Show thank you message for 1.5 seconds
  };

  if (isSubmitted && showThankYou && selectedFeedback) {
    const message = feedbackResponseMessages?.[selectedFeedback] ?? 'Thank you for your feedback!';
    return (
      <Card className="border-[#D1D5DB] bg-white">
        <CardContent className={variant === 'inline' ? 'py-3' : 'pt-6'}>
          <p className={`text-gray-700 ${variant === 'inline' ? 'text-sm' : 'text-lg text-center'}`}>
            {message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted && !showThankYou) {
    return null; // Hide completely after thank you message
  }

  if (variant === 'inline') {
    return (
      <Card className="border-[#D1D5DB] bg-white">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#111827] mr-2">{question}</span>
            {/* The outer row wraps but this inner group did not, so the three
                buttons ran 35px past a 375px viewport and were clipped by the
                shell's overflow-x-hidden. Only the allocator uses this variant. */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFeedback === 'yes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeedbackClick('yes')}
                className={`text-xs h-8 ${
                  selectedFeedback === 'yes'
                    ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {buttonLabels.yes}
              </Button>
              <Button
                variant={selectedFeedback === 'not_sure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeedbackClick('not_sure')}
                className={`text-xs h-8 ${
                  selectedFeedback === 'not_sure'
                    ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {buttonLabels.not_sure}
              </Button>
              <Button
                variant={selectedFeedback === 'no' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeedbackClick('no')}
                className={`text-xs h-8 ${
                  selectedFeedback === 'no'
                    ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {buttonLabels.no}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#D1D5DB] bg-white">
      <CardHeader>
        <CardTitle className="text-xl text-[#111827]">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <Button
            variant={selectedFeedback === 'yes' ? 'default' : 'outline'}
            onClick={() => handleFeedbackClick('yes')}
            className={`w-full ${
              selectedFeedback === 'yes'
                ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {buttonLabels.yes}
          </Button>
          <Button
            variant={selectedFeedback === 'not_sure' ? 'default' : 'outline'}
            onClick={() => handleFeedbackClick('not_sure')}
            className={`w-full ${
              selectedFeedback === 'not_sure'
                ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {buttonLabels.not_sure}
          </Button>
          <Button
            variant={selectedFeedback === 'no' ? 'default' : 'outline'}
            onClick={() => handleFeedbackClick('no')}
            className={`w-full ${
              selectedFeedback === 'no'
                ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {buttonLabels.no}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
