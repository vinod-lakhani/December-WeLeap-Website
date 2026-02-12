import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

const RETURN_ASSUMPTION_PCT = Math.round(REAL_RETURN_DEFAULT * 100);

export interface EarlyAccessLeadBody {
  email: string;
  source?: string;
  salaryAnnual?: number;
  state?: string;
  employerMatchEnabled?: boolean;
  matchPct?: number;
  current401kPct?: number;
  recommended401kPct?: number;
  essentialsMonthly?: number;
  carriesBalance?: boolean;
  debtAprRange?: string;
  debtBalance?: number;
  retirementFocus?: 'high' | 'medium' | 'low';
  nextLeapTitle: string;
  impactAtYear30: number | null;
  costOfDelay12Mo: number | null;
  actionIntent?: boolean | null;
  /** Ordered list of leap titles for email preview (3–5 items) */
  leapTitles: string[];
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Store early access lead (waitlist) and send early access confirmation email.
 * No plan storage. No "return to plan" link. CTA to /mvp-access.
 * No HSA.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EarlyAccessLeadBody;
    const {
      email,
      source = 'leap_stack',
      nextLeapTitle,
      impactAtYear30,
      costOfDelay12Mo,
      actionIntent,
      leapTitles = [],
    } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const baseUrl = getBaseUrl();

    // 1) Lead capture via waitlist (existing pattern)
    const waitlistRes = await fetch(`${baseUrl}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        signupType: 'early_access_leap_stack',
        page: '/allocator',
      }),
    });
    if (!waitlistRes.ok) {
      const data = await waitlistRes.json();
      console.error('[Early Access Lead] Waitlist error:', data);
    }

    // 2) Send early access confirmation email
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const impactFormatted =
      impactAtYear30 != null
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(impactAtYear30)
        : null;
    const costFormatted =
      costOfDelay12Mo != null && costOfDelay12Mo > 0
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(costOfDelay12Mo)
        : null;

    const mvpAccessUrl = `${baseUrl}/mvp-access?confirmed=1`;
    const leapToolUrl = `${baseUrl}/leap-impact-simulator`;

    const planListHtml =
      leapTitles.length > 0
        ? `<ol style="margin: 0; padding-left: 20px; color: #111827; font-size: 15px; line-height: 1.7;">
        ${leapTitles.slice(0, 5).map((t, i) => `<li style="margin-bottom: 6px;">${escapeHtml(t)}</li>`).join('')}
      </ol>`
        : '';

    const fromEmail = 'WeLeap <vinod@weleap.ai>';
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: 'Your Next Leap is ready — execution in ~2 weeks',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;">
          <p style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 24px;">You're on the early access list.</p>

          <p style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Your Next Leap</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 8px;"><strong>${escapeHtml(nextLeapTitle)}</strong></p>
          ${impactFormatted ? `<p style="color: #3F6B42; font-size: 16px; line-height: 1.6; margin-bottom: 4px;">Impact: +${impactFormatted} at Year 30</p>` : ''}
          ${costFormatted ? `<p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Cost of delay: –${costFormatted} if you wait 12 months</p>` : '<p style="margin-bottom: 20px;"></p>'}

          ${planListHtml ? `<p style="color: #111827; font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px;">Your ranked plan</p>${planListHtml}<p style="margin-bottom: 24px;"></p>` : ''}

          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We'll email you the moment execution is live so you can apply this plan in the MVP.</p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${mvpAccessUrl}" style="display: inline-block; background-color: #3F6B42; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Get MVP access</a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">Want to rerun your numbers? <a href="${leapToolUrl}" style="color: #3F6B42;">Open the Leap tool</a></p>

          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; margin-top: 32px;">Assumptions: ${RETURN_ASSUMPTION_PCT}% real return. Planning only today — execution launches soon.</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-top: 24px;">— WeLeap</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[Early Access Lead] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Early access signup confirmed', createdAt },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Early Access Lead] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit' },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
