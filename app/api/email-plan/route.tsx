import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Resend } from 'resend';
import React from 'react';
import { PlanPDF } from '@/lib/pdf/generatePlanPDF';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * API route to generate PDF plan and send via email
 * 
 * Requires environment variable: RESEND_API_KEY
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, planData } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Validate plan data
    if (!planData) {
      return NextResponse.json(
        { error: 'Plan data is required' },
        { status: 400 }
      );
    }

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Plan API] RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate PDF - using React.createElement for server-side rendering
    const pdfBuffer = await renderToBuffer(
      React.createElement(PlanPDF, { planData })
    );

    // Convert buffer to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString('base64');

    // Send email with PDF attachment
    const { data, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'WeLeap <onboarding@resend.dev>',
      to: email,
      subject: 'Your Personal Rent Plan from WeLeap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #111827; margin-bottom: 20px;">Your Personal Rent Plan</h2>
          <p style="color: #374151; line-height: 1.6;">
            Thank you for using WeLeap's rent calculator! We've generated a personalized PDF with your rent range, upfront cash needs, and budget breakdown.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            Your plan is attached to this email. This includes:
          </p>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Your monthly take-home pay breakdown</li>
            <li>Safe rent range recommendation</li>
            <li>Upfront cash needed before your first paycheck</li>
            <li>Monthly budget breakdown (50/30/20 rule)</li>
          </ul>
          <p style="color: #374151; line-height: 1.6; margin-top: 20px;">
            Remember: This is an educational estimate, not financial advice. Use it as a starting point for your apartment search.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Best of luck with your apartment search!<br>
            — The WeLeap Team
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'your-rent-plan.pdf',
          content: pdfBase64,
        },
      ],
    });

    if (emailError) {
      console.error('[Email Plan API] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('[Email Plan API] Email sent successfully:', {
      email,
      messageId: data?.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Plan sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Plan API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send plan',
      },
      { status: 500 }
    );
  }
}
