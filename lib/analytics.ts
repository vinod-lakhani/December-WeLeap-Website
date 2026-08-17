/**
 * Analytics Event Tracking Utility
 * Tracks events to both Google Analytics 4 (GA4) and Vercel Analytics
 *
 * The free-tool funnel, in order. Every step carries the same `tool` slug from
 * FREE_TOOLS so the five events join as one sequence rather than five counts:
 * - tool_viewed (tool, page)          — landed on the calculator
 * - tool_engaged (tool, first_field)  — touched the first input, fires once
 * - tool_completed (tool)             — a real result rendered, fires once
 * - tool_cta_clicked (tool, placement)— clicked through to weleap.app
 * - cta_click_signup (...)            — signup started
 * Plus tool_card_clicked (tool, surface) upstream on /tools and the homepage,
 * and tool_cross_sell_clicked (from, to, surface) between calculators.
 *
 * All seven free tools emit the sequence. What counts as "a real result" is
 * decided per tool, from that tool's own state machine, because firing it at
 * the same moment as tool_engaged makes the step between them measure nothing:
 * - offer            — the tax lookup resolves (take-home stops being a 72% stub)
 * - rent             — the tax API returns and the range renders
 * - smart_purchase   — price, cash and surplus all present, so a recommendation exists
 * - credit_card_payoff — balance AND APR both real (APR 0 passes validation but
 *                      is not an answer this calculator is being asked for)
 * - emergency_fund   — the form advances to the results step
 * - allocator        — the summary step renders with a built stack
 * - net_worth_impact — an input has been moved off its default and the
 *                      recomputed result has held still for 800ms. This tool
 *                      computes from defaults, so a result is on screen before
 *                      anyone touches it; "the visitor's own result" is the
 *                      only completion here that is not just tool_viewed again.
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
 * - emergency_fund_page_view (page, tool_version)
 * - emergency_fund_cta_click (page, tool_version)
 * - emergency_fund_form_start (page, tool_version)
 * - emergency_fund_calculated (page, tool_version, target_months, target_dollars, progress_pct)
 * - emergency_fund_results_viewed (page, tool_version, target_months, target_dollars, progress_pct)
 * - emergency_fund_scenario_slider_changed (page, tool_version, scenario_months, target_dollars)
 * - emergency_fund_recalculate_clicked (page, tool_version)
 * - emergency_fund_feedback_submitted (page, feedback: yes|no|not_sure)
 * - credit_card_payoff_page_view (page, tool_version)
 * - credit_card_payoff_form_start (page, tool_version)
 * - credit_card_payoff_calculated (page, tool_version, balance, apr, months_to_payoff, total_interest)
 * - credit_card_payoff_extra_slider_changed (page, tool_version, extra_payment)
 * - credit_card_payoff_feedback_submitted (page, feedback: yes|no|not_sure)
 *
 * Privacy Note: This utility only sends bucketed/non-PII parameters.
 * Never sends raw salary, email addresses, city names, or exact dates.
 */

import { track as vercelTrack } from '@vercel/analytics';
// Not a static `posthog-js` import: this module is pulled in by every tool
// page, so importing the SDK here would keep it in the initial bundle no
// matter how the provider loads it. See lib/posthog-lazy.ts.
import { getPostHog } from '@/lib/posthog-lazy';

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

  // Track to PostHog — the source of truth for the Phase 0 funnel (HogQL).
  // PostHog is initialized in components/posthog-provider.tsx; capturing here
  // means funnel events (tool_completed, tool_cta_clicked, cta_click_signup,
  // etc.) land in PostHog alongside GA4/Vercel.
  //
  // Before the SDK finishes loading this queues rather than drops, so events
  // fired during hydration still arrive. See lib/posthog-lazy.ts.
  try {
    getPostHog().capture(eventName, params || {});
  } catch (error) {
    if (DEBUG_ANALYTICS) {
      console.error('[Analytics] Error tracking to PostHog:', eventName, error);
    }
    // Continue even if PostHog capture fails
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
