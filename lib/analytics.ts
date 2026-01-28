/**
 * Analytics Event Tracking Utility
 * Tracks events to both Google Analytics 4 (GA4) and Vercel Analytics
 *
 * Event Names:
 * - rent_tool_page_view
 * - hero_cta_click
 * - scrolled_past_how_it_works
 * - rent_form_start
 * - rent_form_submit
 * - playbook_generated
 * - playbook_email_sent
 * - playbook_pdf_opened (optional)
 * - playbook_pdf_downloaded (optional)
 * - rent_tool_feedback_submitted (page, feedback: yes|no|not_sure) — rent tool
 * - networth_tool_feedback_submitted (page, feedback: yes|no|not_sure) — Net Worth Impact tool
 * - waitlist_modal_opened (page, source, feedback)
 * - net_worth_impact_page_view
 * - net_worth_impact_tool_start
 *
 * Privacy Note: This utility only sends bucketed/non-PII parameters.
 * Never sends raw salary, email addresses, city names, or exact dates.
 */

import { track as vercelTrack } from '@vercel/analytics';

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
 * Track an analytics event to both GA4 and Vercel Analytics
 * 
 * @param eventName - The event name
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

  // Track to Vercel Analytics (always available, no waiting needed)
  try {
    vercelTrack(eventName, params || {});
  } catch (error) {
    if (DEBUG_ANALYTICS) {
      console.error('[Analytics] Error tracking to Vercel Analytics:', eventName, error);
    }
    // Continue even if Vercel Analytics fails
  }

  // Track to GA4
  // For critical events like page views, wait for gtag to load
  if (waitForGtagLoading && typeof window.gtag !== 'function') {
    try {
      await waitForGtag(3000); // Wait up to 3 seconds
    } catch (error) {
      if (DEBUG_ANALYTICS) {
        console.warn('[Analytics] gtag not available after waiting, event not sent to GA4:', eventName);
      }
      return; // Still tracked to Vercel Analytics above
    }
  }

  // Check if gtag is available
  if (typeof window.gtag !== 'function') {
    if (DEBUG_ANALYTICS) {
      console.warn('[Analytics] gtag not available, event not sent to GA4:', eventName);
    }
    return; // Still tracked to Vercel Analytics above
  }

  try {
    // Send event to GA4
    window.gtag('event', eventName, params || {});
  } catch (error) {
    if (DEBUG_ANALYTICS) {
      console.error('[Analytics] Error tracking to GA4:', eventName, error);
    }
    // Fail silently in production (still tracked to Vercel Analytics)
  }
}
