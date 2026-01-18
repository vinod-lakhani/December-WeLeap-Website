import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generatePlanPDFBuffer } from '@/lib/pdf/generatePlanPDFSimple';

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

    // Log email request (for tracking)
    console.log('[Email Plan API] Request received:', {
      email,
      hasPlanData: !!planData,
      timestamp: new Date().toISOString(),
    });

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
      console.error('[Email Plan API] Available env vars:', Object.keys(process.env).filter(k => k.includes('RESEND')));
      return NextResponse.json(
        { error: 'Email service not configured - missing API key' },
        { status: 500 }
      );
    }
    
    // Log API key status (first few chars only for security)
    const apiKeyPrefix = process.env.RESEND_API_KEY.substring(0, 10);
    console.log('[Email Plan API] RESEND_API_KEY found, prefix:', apiKeyPrefix + '...');
    
    // Check if from email is configured
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'WeLeap <vinod@weleap.ai>';
    console.log('[Email Plan API] From email:', fromEmail);

    // Generate PDF - ensure planData is valid
    if (!planData || typeof planData !== 'object') {
      throw new Error('Invalid plan data provided');
    }

    // Generate PDF buffer using pdfkit
    let pdfBuffer: Buffer;
    try {
      console.log('[Email Plan API] Starting PDF generation...');
      pdfBuffer = await generatePlanPDFBuffer(planData);
      console.log('[Email Plan API] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError) {
      console.error('[Email Plan API] PDF generation error:', pdfError);
      console.error('[Email Plan API] PDF error type:', typeof pdfError);
      console.error('[Email Plan API] PDF error instanceof Error:', pdfError instanceof Error);
      if (pdfError instanceof Error) {
        console.error('[Email Plan API] PDF error message:', pdfError.message);
        console.error('[Email Plan API] PDF error stack:', pdfError.stack);
      }
      // Log full error details for debugging
      try {
        console.error('[Email Plan API] PDF error JSON:', JSON.stringify(pdfError, Object.getOwnPropertyNames(pdfError)));
      } catch (e) {
        console.error('[Email Plan API] Could not stringify PDF error');
      }
      throw new Error('Failed to generate PDF: ' + (pdfError instanceof Error ? pdfError.message : 'Unknown error'));
    }

    // Convert buffer to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log('[Email Plan API] PDF converted to base64, length:', pdfBase64.length);

    // Get site URL for waitlist link
    const waitlistUrl = 'https://www.weleap.ai';

    // Send email with PDF attachment (fromEmail is already defined above)
    console.log('[Email Plan API] Attempting to send email via Resend...');
    console.log('[Email Plan API] From:', fromEmail);
    console.log('[Email Plan API] To:', email);
    
    const { data, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Salary vs. Rent Analysis from WeLeap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hey,
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Attached is your <strong>Salary vs. Rent analysis</strong> — the real numbers behind your offer letter and apartment.
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            One thing becomes clear once you see this on paper:<br>
            the math <em>works</em>, but the margin for error is thin.
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            This is exactly the moment where most tools stop — they show you numbers and leave you to figure out what to do next.<br>
            <strong>WeLeap is built for what comes next.</strong>
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Inside WeLeap, your Financial Sidekick turns this analysis into a live feed that helps you stay ahead, for example:
          </p>
          
          <p style="color: #111827; font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">
            <strong>Clarity (what just happened)</strong>
          </p>
          <ul style="color: #111827; line-height: 1.8; margin-left: 20px; margin-bottom: 20px;">
            <li><em>"New paycheck detected — want me to optimize it?"</em></li>
            <li><em>"Your rent payment went through. I'll keep an eye on your balance."</em></li>
          </ul>
          
          <p style="color: #111827; font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">
            <strong>Risk (what could go wrong)</strong>
          </p>
          <ul style="color: #111827; line-height: 1.8; margin-left: 20px; margin-bottom: 20px;">
            <li><em>"Your account balance may dip below $200 before the next paycheck."</em></li>
            <li><em>"Spending is trending high this month — want to adjust before it becomes a problem?"</em></li>
          </ul>
          
          <p style="color: #111827; font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">
            <strong>Next Leaps (what to do now)</strong>
          </p>
          <ul style="color: #111827; line-height: 1.8; margin-left: 20px; margin-bottom: 24px;">
            <li><em>"Savings Leap: Shift $75 this month → emergency fund reaches 25% faster."</em></li>
            <li><em>"Income Leap: Adjust your paycheck allocation → stay on track without feeling squeezed."</em></li>
            <li><em>"Debt Leap: One small payment now saves $X in interest."</em></li>
          </ul>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            No dashboards to babysit.<br>
            No generic budgeting rules.<br>
            Just <strong>one clear next move at a time</strong>, tied to your actual numbers.
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We're opening a limited <strong>Beta</strong> for seniors and recent grads navigating the jump from offer letter to first paycheck — and beyond.
          </p>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            If you want a sidekick that helps you stay steady <em>after</em> the lease is signed, you can join here:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${waitlistUrl}" style="display: inline-block; background-color: #3F6B42; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Join the WeLeap Waitlist
            </a>
          </div>
          
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin-top: 32px; margin-bottom: 8px;">
            Rooting for you,
          </p>
          
          <p style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 0;">
            <strong>The WeLeap Team</strong>
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
      console.error('[Email Plan API] Resend error:', JSON.stringify(emailError, null, 2));
      
      // Check for domain verification or testing mode error
      const errorMessage = typeof emailError === 'object' && emailError !== null 
        ? (emailError as any).message || JSON.stringify(emailError)
        : String(emailError);
      
      const statusCode = typeof emailError === 'object' && emailError !== null 
        ? (emailError as any).statusCode 
        : undefined;
      
      let userFriendlyError = 'Failed to send email';
      
      // Handle Resend testing mode or domain verification errors
      if (statusCode === 403 && errorMessage.includes('testing emails')) {
        // In testing mode, Resend only allows sending to the account owner's email
        // This usually means the API key is a test key, or the domain isn't verified
        userFriendlyError = 'Email service is currently in testing mode. This may be due to domain verification or API key configuration. Please check Vercel environment variables.';
        console.error('[Email Plan API] Testing mode error - check RESEND_API_KEY and domain verification in Resend dashboard');
      } else if (errorMessage.includes('domain is not verified') || errorMessage.includes('verify your domain')) {
        userFriendlyError = 'Email service is being set up. Please try again later or contact support.';
      } else if (statusCode === 403) {
        userFriendlyError = 'Email service configuration issue. Please verify RESEND_API_KEY in Vercel environment variables.';
        console.error('[Email Plan API] 403 error - verify RESEND_API_KEY is set correctly in Vercel');
      } else if (statusCode === 401) {
        userFriendlyError = 'Invalid API key. Please verify RESEND_API_KEY in Vercel environment variables.';
        console.error('[Email Plan API] 401 error - RESEND_API_KEY may be invalid or expired');
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          details: process.env.NODE_ENV === 'development' 
            ? (emailError instanceof Error ? emailError.message : errorMessage)
            : undefined
        },
        { status: 500 }
      );
    }

    console.log('[Email Plan API] Email sent successfully:', {
      email,
      messageId: data?.id,
      timestamp: new Date().toISOString(),
    });

    // Log to Google Sheets (same as waitlist)
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (GOOGLE_SCRIPT_URL) {
      try {
        const timestamp = new Date().toISOString();
        const sheetData = {
          email,
          signupType: 'email_plan',
          page: '/how-much-rent-can-i-afford',
          timestamp,
          salary: planData.salary,
          city: planData.city,
          startDate: planData.startDate,
        };

        console.log('[Email Plan API] Sending to Google Sheets:', sheetData);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sheetData),
        });

        const responseText = await response.text();
        console.log('[Email Plan API] Google Sheets response status:', response.status);
        console.log('[Email Plan API] Google Sheets response:', responseText);

        if (!response.ok) {
          console.error('[Email Plan API] Failed to write to Google Sheets:', responseText);
          // Still return success to user, but log error for debugging
        } else {
          console.log('[Email Plan API] Successfully wrote to Google Sheets');
        }
      } catch (error) {
        console.error('[Email Plan API] Error sending to Google Sheets:', error);
        // Log the full error for debugging
        if (error instanceof Error) {
          console.error('[Email Plan API] Error message:', error.message);
          console.error('[Email Plan API] Error stack:', error.stack);
        }
        // Still return success to user
      }
    } else {
      // Log to console if no webhook is configured
      console.warn('[Email Plan API] Google Sheets not configured - GOOGLE_SCRIPT_URL environment variable is missing');
      console.log('[Email Plan API] Email plan request (not saved to Google Sheets):', {
        email,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Plan sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Plan API] Error:', error);
    console.error('[Email Plan API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Email Plan API] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Provide more detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to send plan';
    const errorDetails = error instanceof Error && error.stack ? error.stack : String(error);
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
