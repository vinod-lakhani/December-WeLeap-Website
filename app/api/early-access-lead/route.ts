import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';
import { submitToWaitlist } from '@/lib/waitlist';

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
  annualContributionIncrease?: number | null;
  costOfDelay12Mo: number | null;
  actionIntent?: boolean | null;
  /** Ordered list of leap titles for email preview (3–5 items) */
  leapTitles: string[];
}

function getBaseUrl(request: NextRequest): string {
  try {
    const url = new URL(request.url);
    if (url.origin) return url.origin;
  } catch {
    // fallback
  }
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
      annualContributionIncrease,
      costOfDelay12Mo,
      actionIntent,
      leapTitles = [],
    } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const createdAt = new Date().toISOString();

    // 1) Lead capture via waitlist (direct call – no internal HTTP fetch)
    await submitToWaitlist({
      email: email.trim(),
      signupType: 'early_access_leap_stack',
      page: '/allocator',
    });

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
    const annualFormatted =
      annualContributionIncrease != null && annualContributionIncrease > 0
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(annualContributionIncrease)
        : null;
    const costFormatted =
      costOfDelay12Mo != null && costOfDelay12Mo > 0
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(costOfDelay12Mo)
        : null;

    const baseUrl = getBaseUrl(request);
    const leapToolUrl = `${baseUrl}/leap-impact-simulator`;

    // Filter out redundant items (e.g. "Brokerage (part of split above)")
    const planTitles = leapTitles.filter((t) => !t.toLowerCase().includes('brokerage (part of split'));
    const planListHtml =
      planTitles.length > 0
        ? `<ol style="margin: 0; padding-left: 20px; color: #111827; font-size: 15px; line-height: 1.7;">
        ${planTitles.slice(0, 6).map((t) => `<li style="margin-bottom: 6px;">${escapeHtml(t)}</li>`).join('')}
      </ol>`
        : '';

    const fromEmail = 'WeLeap <vinod@weleap.ai>';
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: 'Your full money plan is ready — execution in ~2 weeks',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;">
          <p style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 24px;">You're on the early access list.</p>

          <p style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Your next move</p>
          ${nextLeapTitle ? `<p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">Do this: <strong>${escapeHtml(nextLeapTitle)}</strong></p>` : ''}
          ${annualFormatted ? `<p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 4px;">Annual contribution increase: ${annualFormatted}</p>` : ''}
          ${impactFormatted ? `<p style="color: #3F6B42; font-size: 16px; line-height: 1.6; margin-bottom: 4px;">30-year compounded value: ~${impactFormatted}</p>` : ''}
          ${costFormatted ? `<p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Waiting 12 months costs ~${costFormatted}</p>` : '<p style="margin-bottom: 20px;"></p>'}

          ${planListHtml ? `<p style="color: #111827; font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px;">Your full money plan</p><p style="color: #6B7280; font-size: 14px; margin-bottom: 8px;">How it flows: 40% safety buffer → 40% of remainder to debt → rest split retirement/brokerage.</p>${planListHtml}<p style="margin-bottom: 24px;"></p>` : ''}

          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We'll email you the moment execution is live so you can apply your plan in the MVP.</p>

          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">Want to rerun your numbers? <a href="${leapToolUrl}" style="color: #3F6B42;">Open the Leap tool</a></p>

          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; margin-top: 32px;">Assumes ${RETURN_ASSUMPTION_PCT}% real return. Planning only today — execution launches soon.</p>
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
