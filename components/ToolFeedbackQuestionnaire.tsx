'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

interface ToolFeedbackQuestionnaireProps {
  page: string;
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

export function ToolFeedbackQuestionnaire({ page, eventName = 'rent_tool_feedback_submitted', question = 'Was this helpful?', buttonLabels = { yes: 'Yes', not_sure: 'Not sure', no: 'No' }, feedbackResponseMessages, variant = 'default', extraTrackParams, onFeedbackSubmitted }: ToolFeedbackQuestionnaireProps) {
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
            <div className="flex gap-2">
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
