/**
 * Google Analytics 4 (GA4) Event Tracking Utility
 * 
 * GA4 Event Names:
 * - rent_tool_page_view
 * - hero_cta_click
 * - scrolled_past_how_it_works
 * - rent_form_start
 * - rent_form_submit
 * - playbook_generated
 * - playbook_email_sent
 * - playbook_pdf_opened (optional)
 * - playbook_pdf_downloaded (optional)
 * 
 * Privacy Note: This utility only sends bucketed/non-PII parameters.
 * Never sends raw salary, email addresses, city names, or exact dates.
 */

// Enable debug mode via environment variable
const DEBUG_ANALYTICS = process.env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'js' | 'event',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Wait for gtag to be available (with timeout)
 * Useful when GA4 is loaded asynchronously
 */
function waitForGtag(maxWaitMs: number = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    if (typeof window.gtag === 'function') {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (typeof window.gtag === 'function') {
        clearInterval(checkInterval);
        resolve();
        return;
      }

      if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval);
        reject(new Error('gtag timeout'));
      }
    }, 100);
  });
}

/**
 * Track a GA4 event
 * 
 * @param eventName - The GA4 event name
 * @param params - Event parameters (must not contain PII)
 * @param waitForGtagLoading - If true, waits for gtag to load before sending (default: false for most events, true for critical page view events)
 */
export async function track(eventName: string, params?: Record<string, any>, waitForGtagLoading: boolean = false) {
  // Debug logging when enabled
  if (DEBUG_ANALYTICS || (typeof window !== 'undefined' && (window as any).DEBUG_ANALYTICS)) {
    console.log('[Analytics]', eventName, params || '');
  }

  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // For critical events like page views, wait for gtag to load
  if (waitForGtagLoading && typeof window.gtag !== 'function') {
    try {
      await waitForGtag(3000); // Wait up to 3 seconds
    } catch (error) {
      if (DEBUG_ANALYTICS) {
        console.warn('[Analytics] gtag not available after waiting, event not sent:', eventName);
      }
      return;
    }
  }

  // Check if gtag is available
  if (typeof window.gtag !== 'function') {
    if (DEBUG_ANALYTICS) {
      console.warn('[Analytics] gtag not available, event not sent:', eventName);
    }
    return;
  }

  try {
    // Send event to GA4
    window.gtag('event', eventName, params || {});
  } catch (error) {
    if (DEBUG_ANALYTICS) {
      console.error('[Analytics] Error tracking event:', eventName, error);
    }
    // Fail silently in production
  }
}
