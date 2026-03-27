/**
 * Shared waitlist logic for lead capture (Google Sheets).
 * Used by /api/waitlist and /api/early-access-lead to avoid internal HTTP fetches.
 */
export interface WaitlistPayload {
  email: string;
  signupType: string;
  page: string;
  ref?: string;
  /** Where the CTA lived (e.g. signupType + path, or an explicit placement label). */
  source?: string;
  /** HTTP Referer: previous page URL when available (empty if direct / stripped). */
  referrer?: string;
}

function clipReferrer(value: string | undefined): string {
  if (!value) return "";
  const max = 2000;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** Keeps the same Sheet columns: everything lives in `page` as path + query (ref, source, wref). */
function appendPageTracking(
  page: string,
  fields: { ref?: string; source?: string; wref?: string }
): string {
  let out = page;
  const entries = Object.entries(fields).filter(
    ([, v]) => v != null && String(v).length > 0
  ) as [string, string][];
  for (const [key, value] of entries) {
    const sep = out.includes("?") ? "&" : "?";
    out = `${out}${sep}${key}=${encodeURIComponent(value)}`;
  }
  return out;
}

export async function submitToWaitlist(payload: WaitlistPayload): Promise<void> {
  const { email, signupType, page, ref, source, referrer } = payload;
  const timestamp = new Date().toISOString();
  const wref = clipReferrer(referrer);
  const pageForSheet = appendPageTracking(page, {
    ref: ref ?? undefined,
    source: source?.trim() || undefined,
    wref: wref || undefined,
  });
  const sheetData = {
    email,
    signupType,
    page: pageForSheet,
    timestamp,
  };

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
