import { NextRequest, NextResponse } from 'next/server';
import { buildAllocatorPrefillUrl } from '@/lib/leapImpact/allocatorLink';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface LeapStackSaveBody {
  email: string;
  source?: string;
  salaryAnnual: number;
  state: string;
  netMonthlyEstimate?: number;
  employerMatchEnabled: boolean;
  matchPct: number;
  current401kPct: number;
  recommended401kPct: number;
  essentialsMonthly?: number;
  carriesBalance?: boolean;
  debtAprRange?: string;
  debtBalance?: number;
  retirementFocus?: 'high' | 'medium' | 'low';
  computedLeaps?: Array<{ id: string; title: string; status: string; impactText?: string }>;
  delta30yr?: number;
  nextLeapTitle?: string;
}

/**
 * Save Leap Stack plan: store lead (waitlist) + send email with link to return.
 * No HSA. Uses existing waitlist pattern and Resend for email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeapStackSaveBody;
    const {
      email,
      source = 'leap_stack',
      salaryAnnual,
      state,
      netMonthlyEstimate,
      employerMatchEnabled,
      matchPct,
      current401kPct,
      recommended401kPct,
      nextLeapTitle,
      delta30yr,
    } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // 1) Lead capture via waitlist (existing pattern)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const waitlistRes = await fetch(`${baseUrl}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        signupType: 'leap_stack_save',
        page: '/allocator',
      }),
    });
    if (!waitlistRes.ok) {
      const data = await waitlistRes.json();
      console.error('[Leap Stack Save] Waitlist error:', data);
      // Continue to send email even if waitlist fails
    }

    // 2) Send email with plan summary and link to return
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const allocatorUrl = buildAllocatorPrefillUrl({
      salaryAnnual,
      state,
      estimatedNetMonthlyIncome: netMonthlyEstimate,
      employerMatchEnabled: employerMatchEnabled ?? false,
      employerMatchPct: matchPct ?? 0,
      current401kPct: current401kPct ?? 0,
      recommended401kPct: recommended401kPct ?? 0,
      leapDelta30yr: delta30yr,
      intent: 'unlock_full_stack',
      source: source === 'leap_stack' ? 'leap_stack_email' : source,
    });

    const deltaFormatted =
      delta30yr != null
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(delta30yr)
        : null;

    const fromEmail = 'WeLeap <vinod@weleap.ai>';
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: 'Your Leap stack plan from WeLeap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hey,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Here’s your saved <strong>Leap stack plan</strong>.
          </p>
          ${nextLeapTitle ? `<p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 12px;"><strong>Next Leap:</strong> ${nextLeapTitle}</p>` : ''}
          ${deltaFormatted ? `<p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">30-year impact: <strong>${deltaFormatted}</strong></p>` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${allocatorUrl}" style="display: inline-block; background-color: #3F6B42; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Open your plan
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
            This link opens your allocation plan with your numbers. You can return anytime.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-top: 24px;">— WeLeap</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[Leap Stack Save] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Plan saved', timestamp },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Leap Stack Save] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save plan' },
      { status: 500 }
    );
  }
}
