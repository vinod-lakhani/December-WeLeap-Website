'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

interface ToolFeedbackQuestionnaireProps {
  onFeedbackSubmitted: (feedback: 'yes' | 'no' | 'not_sure') => void;
}

export function ToolFeedbackQuestionnaire({ onFeedbackSubmitted }: ToolFeedbackQuestionnaireProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<'yes' | 'no' | 'not_sure' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFeedbackClick = (feedback: 'yes' | 'no' | 'not_sure') => {
    setSelectedFeedback(feedback);
    setIsSubmitted(true);
    
    // Track feedback submission
    track('tool_feedback_submitted', {
      page: '/how-much-rent-can-i-afford',
      feedback: feedback,
    });
    
    // Call callback to show/hide WaitlistForm
    onFeedbackSubmitted(feedback);
  };

  if (isSubmitted) {
    return null; // Hide questionnaire after submission
  }

  return (
    <Card className="border-[#D1D5DB] bg-white">
      <CardHeader>
        <CardTitle className="text-xl text-[#111827]">Did you find this tool useful?</CardTitle>
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
            Yes
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
            Not sure
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
            No
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
