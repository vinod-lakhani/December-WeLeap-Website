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
 * Cross-tool events added alongside the funnel, each replacing a set of
 * per-tool names that could only be assembled by hand:
 * - leap_shown (tool, leap_type, engine: 'site', leap_value_usd?) — what the
 *   tool actually recommended and what it was worth. `engine` is load-bearing:
 *   the APP fires an event of the same name from its own recommendation
 *   engine, and without the discriminator the two blend into one series that
 *   reads as a single funnel and is really two products.
 * - leap_feedback (tool, answer: yes|not_sure|not_relevant, scale?) — the
 *   acceptance-rate gate. `scale: 'expectation'` marks the offer tool, whose
 *   answers are a direction rather than a sentiment; exclude or split on it
 *   before blending.
 * - tool_shared (tool, method: native|copy_link|download) — only rent and
 *   offer have a share affordance at all, so this covers two of seven by
 *   design rather than by omission.
 * - slider_moved (tool, slider, from_rate, savings_rate, direction, money_age,
 *   delta_years, move_index) — one event per GESTURE, not per step. A range
 *   input fires onChange on every point it passes, so tracking it raw counts
 *   how far somebody dragged rather than how many people dragged; Money Age
 *   debounces to the end of the movement. Only Money Age emits it so far.
 *   CreditCardPayoffTool and EmergencyFundTool still fire their own per-tool
 *   slider events straight off onChange, and those two series should not be
 *   read as comparable to this one until they move over.
 *
 * `tool_completed` also carries `run_index`: which run this was for this
 * browser, counting from 1. count() and uniq(person_id) already separate runs
 * from people in aggregate; this says whether a given answer was someone's
 * first or their fourth, which is what makes re-runners comparable only to
 * each other.
 *
 * Every free tool emits the sequence.
 *
 * WHAT COUNTS AS COMPLETION. One definition, every tool, every traffic source:
 *
 *     tool_completed = a result is on screen AND the visitor did something
 *
 * This used to be decided per tool, from that tool's own state machine,
 * because firing it at the same moment as tool_engaged makes the step between
 * them measure nothing. That reasoning is sound and the consequence was not.
 * Ten tools had ten gates — a tax lookup here, a scroll position there, a
 * wizard step somewhere else — and once campaign landings existed, two gates
 * on the SAME tool. Numbers produced that way cannot be read against each
 * other, which is the entire point of having them.
 *
 * "Did something" means a changed input OR a document that parsed. An upload
 * that fills the form is the highest-intent action a tool offers, and counting
 * it as zero engagement reported those visitors as bounces. A parse that
 * filled nothing does not count; doc_parse_failed already covers that.
 *
 * tool_result_shown (tool, campaign?) carries the other moment, the one
 * completion used to be overloaded with: a result rendered, whoever put it
 * there. For the tools that compute from defaults — the campaign landings, the
 * loan tool, the saving calculator — that is page load, and saying so plainly
 * beats a completion event that quietly means "arrived" on three tools and
 * "typed something" on the rest. lib/tool-funnel.ts owns it; every tool emits
 * it, and lib/tool-instrumentation.test.ts fails the build if one stops.
 *
 * Two gates were actually wrong rather than merely different, and both are
 * fixed: the offer tool waited on a tax lookup that campaign sessions never
 * trigger, so those sessions could not complete at all; and the loan tool
 * completed when its advice card was scrolled to, on a page that computes from
 * defaults, so reading the worked example counted the same as pricing your own
 * loan. That scroll signal was worth keeping and kept, as tool_advice_reached.
 *
 * tool_completed carries `campaign: true` only on campaign sessions, so the
 * ordinary payload is unchanged for anything already reading it.
 *
 * NOTE FOR ANYONE READING A TIME SERIES ACROSS THIS CHANGE: completions moved.
 * They rise on the offer tool (no longer waiting on the tax lookup) and fall on
 * the loan tool (a scroll is no longer enough). Mark the deploy date before
 * comparing anything to history.
 *
 * Event Names:
 * - rent_tool_page_view
 * - hero_cta_click
 * - hero_leap_engaged / hero_leap_calculated (salary_bucket, leap_value_usd) /
 *   hero_leap_cta_clicked (salary_bucket) / hero_tools_link_clicked — the
 *   homepage hero, which is now a one-question calculator rather than a
 *   description of one. Deliberately NOT the tool_* funnel: `tool` is a
 *   FREE_TOOLS slug, the homepage is not a registered tool, and adding a
 *   'home' slug would break the completeness check that asserts every tool
 *   appear. Salary is bucketed, never sent raw.
 * - scrolled_past_how_it_works
 * - rent_form_start
 * - rent_form_submit
 * - playbook_generated
 * - playbook_email_sent
 * - playbook_pdf_opened (optional)
 * - playbook_pdf_downloaded (optional)
 * - rent_tool_feedback_submitted (page, feedback: yes|no|not_sure) — rent tool
 * - networth_tool_feedback_submitted (page, feedback: yes|no|not_sure) — Monthly Saving Impact tool
 * - offer_tool_feedback_submitted (page, feedback: yes|no|not_sure, scale: 'expectation') — offer tool.
 *   `scale` is load-bearing: this tool's three answers are a DIRECTION (higher /
 *   as expected / lower), not a sentiment, so "no" means the offer was worth
 *   less than they hoped rather than that the tool failed. Exclude it, or split
 *   on `scale`, before blending feedback across tools.
 * - purchase_tool_feedback_submitted (page, feedback: yes|no|not_sure) — Buy Now, Pay Later tool
 *
 * Sharing. Only rent and offer have a share affordance at all; the other five
 * tools have none, which is why the share rate looks like zero rather than
 * having been measured. `*_opened` counts people who reached the card,
 * `*_shared` counts people who completed the gesture — the gap between them is
 * the one worth watching:
 * - rent_share_card_opened (page)
 * - rent_share_card_shared (page, method: native|download)
 * - rent_share_card_downloaded (page)
 * - offer_share_card_opened (page)
 * - offer_share_card_shared (page, method: native|download, uplift_pct)
 * - offer_share_card_downloaded (page, uplift_pct)
 *
 * The receiving half of the share loop:
 * - share_landing_viewed (tool, claim_kind, metro) — arrived on a shared claim
 * - share_landing_cta_clicked (tool, claim_kind)   — acted on one
 *
 * Plus the `entry_src` SUPER PROPERTY, not an event. Registered once on the
 * first page load carrying `?src=` (see lib/utm-storage.ts) and attached by
 * PostHog to every subsequent event that visitor fires. So the existing funnel
 * — tool_viewed through cta_click_signup — is segmentable by `entry_src =
 * 'share'` with no per-event changes. Before it, a visitor arriving from a
 * shared link became indistinguishable from an organic one the moment they
 * left the landing page, which left the whole referral question unanswerable.
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
