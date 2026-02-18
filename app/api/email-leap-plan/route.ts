import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildAllocatorUrl } from '@/lib/leapImpact/allocatorLink';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * API route to send Leap Impact plan summary email (allocator link + short summary).
 * Same pattern as email-plan: Resend with WeLeap from address.
 * Requires: RESEND_API_KEY
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, planData } = body as {
      email: string;
      planData?: {
        salary?: number;
        state?: string;
        netMonthly?: number;
        recommended401kPct?: number;
        delta30yr?: number;
        annualContributionIncrease?: number | null;
        leapSummary?: string;
      };
    };

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Leap Plan API] RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const fromEmail = 'WeLeap <vinod@weleap.ai>';
    if (fromEmail.includes('resend.dev')) {
      return NextResponse.json(
        { error: 'Invalid from address' },
        { status: 500 }
      );
    }

    const salary = planData?.salary ?? 0;
    const state = planData?.state ?? '';
    const netMonthly = planData?.netMonthly;
    const recommended401kPct = planData?.recommended401kPct;
    const allocatorUrl = buildAllocatorUrl({
      salary,
      state,
      netMonthly,
      recommended401kPct,
    });

    const deltaFormatted =
      planData?.delta30yr != null
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(planData.delta30yr)
        : null;
    const annualFormatted =
      planData?.annualContributionIncrease != null && planData.annualContributionIncrease > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(planData.annualContributionIncrease)
        : null;
    const leapSummary = planData?.leapSummary ?? 'Your single highest-impact Leap';

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your trajectory summary from WeLeap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hey,
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Here’s your <strong>trajectory summary</strong> from the Leap Impact Simulator.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${leapSummary}. ${annualFormatted ? `Annual contribution increase: ${annualFormatted}. ` : ''}${deltaFormatted ? `30-year compounded value: ~${deltaFormatted} in projected net worth.` : ''}
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Unlock your full Leap stack — emergency fund target, high-APR debt, and retirement vs brokerage split — in one place.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${allocatorUrl}" style="display: inline-block; background-color: #3F6B42; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Unlock my full Leap stack
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
            This link opens your allocation plan with the numbers you entered prefilled. Takes about 2 minutes to complete.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-top: 24px;">
            — WeLeap
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[Email Leap Plan API] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Leap Plan API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
