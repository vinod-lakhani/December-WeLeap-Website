/**
 * Shared waitlist logic for lead capture (Google Sheets).
 * Used by /api/waitlist and /api/early-access-lead to avoid internal HTTP fetches.
 */
export interface WaitlistPayload {
  email: string;
  signupType: string;
  page: string;
}

export async function submitToWaitlist(payload: WaitlistPayload): Promise<void> {
  const { email, signupType, page } = payload;
  const timestamp = new Date().toISOString();
  const sheetData = { email, signupType, page, timestamp };

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  if (GOOGLE_SCRIPT_URL) {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetData),
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error('[Waitlist] Failed to write to Google Sheets:', responseText);
      }
    } catch (error) {
      console.error('[Waitlist] Error sending to Google Sheets:', error);
      if (error instanceof Error) {
        console.error('[Waitlist] Error message:', error.message);
      }
      // Don't throw - waitlist is non-critical; email is the primary path
    }
  } else {
    console.warn('[Waitlist] GOOGLE_SCRIPT_URL not configured');
    console.log('[Waitlist] Data (not saved):', sheetData);
  }
}
