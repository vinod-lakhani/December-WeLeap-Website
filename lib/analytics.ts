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
 * - leap_impact_viewed (page load)
 * - leap_impact_calculated (salary, state, match_yesno, current_pct, match_pct, recommended_pct, delta_30yr)
 * - leap_impact_email_submitted
 * - leap_impact_continue_to_allocator_clicked
 * - leap_stack_unlock_clicked
 * - leap_impact_feedback_submitted (page, feedback: yes|no|not_sure)
 * - leap_email_submit_success (intent, salary, state, current401kPct, recommended401kPct, delta30yr)
 * - leap_redirect_to_allocator (intent)
 * - allocator_prefill_loaded (source, intent)
 * - allocator_stack_step_completed (stepName)
 * - allocator_stack_completed
 * - leap_stack_rendered (hasUnlockData, numLeaps, nextLeapId)
 * - leap_stack_plan_viewed (numLeaps, hasDebt, retirementFocus)
 * - leap_stack_summary_viewed (numLeaps)
 * - leap_stack_started (source)
 * - leap_stack_step_completed (stepName)
 * - leap_stack_item_clicked (leapId, action)
 * - leap_stack_input_completed (stepName)
 * - leap_stack_next_leap_changed (fromLeapId, toLeapId)
 * - leap_stack_save_clicked
 * - leap_plan_save_clicked
 * - leap_plan_save_success
 * - leap_plan_save_fail (error)
 * - leap_stack_email_submit_success
 * - leap_stack_email_submit_failed (error)
 * - mvp_apply_clicked
 * - early_access_modal_viewed
 * - early_access_submitted (source, actionIntent, nextLeapTitle, impactAtYear30)
 * - early_access_email_send_success
 * - early_access_email_send_failed (error)
 * - mvp_access_page_viewed
 * - leap_tool_rerun_clicked (source)
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
