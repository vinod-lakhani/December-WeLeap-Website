'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EarlyAccessDialog } from '@/components/early-access-dialog';
import { Button } from '@/components/ui/button';

export function WaitlistForm() {
  return (
    <Card className="border-[#D1D5DB] bg-white">
      <CardHeader>
        <CardTitle className="text-xl text-[#111827]">Want the full plan along with additional leaps?</CardTitle>
      </CardHeader>
      <CardContent>
        <EarlyAccessDialog signupType="salary_tool">
          <Button className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90">
            Join waitlist
          </Button>
        </EarlyAccessDialog>
      </CardContent>
    </Card>
  );
}
