# Analytics Events Reference

This document describes all analytics events tracked in the December-WeLeap-Website project.

## How It Works

- **Utility:** `lib/analytics.ts` provides a single `track(eventName, params?, waitForGtagLoading?)` function.
- **Destinations:** Events are sent to both **Google Analytics 4 (GA4)** and **Vercel Analytics**.
- **Privacy:** Only non-PII parameters (bucketed values, IDs, counts) are sent. No raw salary, email, or exact location.

---

## Leap Impact Simulator (`/leap-impact-simulator`)

| Event | When | Common Params |
|-------|------|---------------|
| `leap_impact_viewed` | Page load | `page: '/leap-impact-simulator'` |
| `landing_cta_click_show_next_move` | User clicks "Show my next move" CTA | `page` |
| `leap_impact_calculated` | User runs the 401(k) impact calculation | `salary`, `state`, match flags, `current_pct`, `match_pct`, `recommended_pct`, `delta_30yr` (bucketed) |
| `results_viewed` | User sees results after calculation | `page` |
| `leap_impact_feedback_submitted` | User submits feedback on results ("Does this next move make sense?") | `page`, `feedback` (yes/not_sure/no) |
| `full_stack_expand_clicked` | User clicks "See my full Leap stack" | `page` |
| `leap_impact_email_submitted` | User submits email on simulator | `page` |
| `leap_email_submit_success` | Email send succeeds | `intent`, salary/state/401k params (bucketed), `delta30yr` |
| `leap_stack_unlock_clicked` | User clicks to unlock full stack | `page` |
| `leap_redirect_to_allocator` | User is redirected to allocator | `intent` (e.g. `unlock_full_stack`) |

---

## Allocator / Leap Stack (`/allocator`)

| Event | When | Common Params |
|-------|------|---------------|
| `allocator_prefill_loaded` | Allocator loads with URL/prefill data | `source`, `intent` |
| `leap_stack_started` | User starts the stack flow | `source` |
| `leap_stack_rendered` | Stack is rendered (leaps computed) | `hasUnlockData`, `numLeaps`, `nextLeapId` |
| `leap_stack_plan_viewed` | User sees the plan view | `numLeaps`, `hasDebt`, `retirementFocus` |
| `leap_stack_summary_viewed` | User reaches Summary step | `numLeaps` |
| `leap_stack_next_leap_changed` | "Next leap" recommendation changes | `fromLeapId`, `toLeapId` |
| `allocator_stack_step_completed` | User completes a step | `stepName` |
| `full_stack_step_completed_{safety\|debt\|retirement\|hsa}` | User completes a full-stack step | `stepName` |
| `leap_stack_input_completed` | User completes input for a step | `stepName` |
| `leap_stack_step_completed` | Step completion (with step name) | `stepName` |
| `summary_viewed` | User reaches Summary step | `numLeaps` |
| `leap_full_plan_feedback_submitted` | User submits feedback on full plan ("Does this full plan feel useful?") | `page`, `feedback` (yes/not_sure/no) |
| `plan_saved_or_waitlist_joined` | User saves plan or joins waitlist | `source` |
| `allocator_stack_completed` | User finishes the full stack flow | (none) |
| `leap_stack_item_clicked` | User clicks a leap item (e.g. "Unlock") | `leapId`, `action: 'unlock'` |

---

## Early Access / MVP

| Event | When | Common Params |
|-------|------|---------------|
| `mvp_apply_clicked` | User clicks "Join the MVP" (or similar) | (none) |
| `early_access_modal_viewed` | Early access modal is shown | (none) |
| `early_access_submitted` | User submits email in early access | `source`, `actionIntent`, `nextLeapTitle`, `impactAtYear30` |
| `early_access_email_send_success` | Early access email send succeeds | (none) |
| `early_access_email_send_failed` | Send fails | `error` |
| `mvp_access_page_viewed` | User lands on MVP access / thank-you page | (none) |
| `leap_tool_rerun_clicked` | User clicks to rerun Leap tool from MVP page | `source: 'mvp_access'` |

---

## Rent / "How Much Rent" Tool (`/how-much-rent-can-i-afford`)

| Event | When | Common Params |
|-------|------|---------------|
| `rent_tool_page_view` | Page load | (optional page/source params) |
| `scrolled_past_how_it_works` | User scrolls past "How it works" | (none) |
| `rent_form_start` | User starts the rent form | (form context, non-PII) |
| `rent_form_submit` | User submits the rent form | (non-PII form summary) |
| `rent_tool_leap_cta_clicked` | User clicks "Run My Full Allocation Plan" from rent tool | `page` |
| `playbook_generated` | Playbook is generated | (non-PII) |
| `playbook_email_sent` | Playbook email is sent | (non-PII) |
| `hero_cta_click` | User clicks hero CTA | (none or non-PII) |
| `other_state_selected_v1` | User selects "other" state | (non-PII) |
| `other_metro_selected_v1` | User selects "other" metro | (non-PII) |
| `offer_tool_debt_enabled` | User enables debt in offer tool | (none) |
| `offer_tool_assumptions_opened` | User opens assumptions | (none) |
| `rent_tool_feedback_submitted` | User submits rent-tool feedback | `page`, `feedback` (yes/no/not_sure) — from ToolFeedbackQuestionnaire |
| `market_rent_loaded_v1` | Market rent (ZORI) data loads | (non-PII) |
| `market_rent_unavailable_v1` | Market rent fails or missing | (non-PII) |

---

## Net Worth Impact (`/net-worth-impact`)

| Event | When | Common Params |
|-------|------|---------------|
| `net_worth_impact_page_view` | Page load | `page`, `tool_version` |
| `net_worth_impact_tool_start` | User starts the tool | (non-PII) |
| `waitlist_modal_opened` | Waitlist modal is opened | `page`, `source`, `feedback` (when from feedback) |
| `networth_tool_feedback_submitted` | User submits net worth feedback | `page`, `feedback` — from ToolFeedbackQuestionnaire |

---

## Documented but Not (or Rarely) Fired in Code

- `playbook_pdf_opened` / `playbook_pdf_downloaded` — not implemented
- `leap_stack_save_clicked`, `leap_plan_save_clicked`, `leap_plan_save_success`, `leap_plan_save_fail`
- `leap_stack_email_submit_success` / `leap_stack_email_submit_failed`

---

## Summary

- **Leap flow:** Funnel from simulator → allocator (prefill, steps, plan/summary views, next leap, completion, item clicks).
- **Conversion:** Early access / MVP (modal view, submit, success/fail) and MVP access page view.
- **Rent tool:** Page view, scroll, form start/submit, playbook, email, offer-tool options (debt, assumptions, state/metro), market rent load.
- **Net worth:** Page view, tool start, waitlist modal, feedback.
