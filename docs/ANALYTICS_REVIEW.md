# Analytics Review: Rent Tool & Leap Tool

> Last updated after removing Day-0 A/B test and cleaning up docs.

## Summary

| Tool | Events Fired |
|------|--------------|
| **Rent** | 14 event types (no Day-0 events) |
| **Leap** | 9 event types |

---

## Rent Tool (`/how-much-rent-can-i-afford`)

| Event | Location |
|-------|----------|
| `rent_tool_page_view` | `app/how-much-rent-can-i-afford/page.tsx` |
| `scrolled_past_how_it_works` | `app/how-much-rent-can-i-afford/page.tsx` |
| `hero_cta_click` | `components/OfferTool.tsx` |
| `rent_form_start` | `components/OfferTool.tsx` |
| `rent_form_submit` | `components/OfferTool.tsx` |
| `playbook_generated` | `components/OfferTool.tsx` |
| `playbook_email_sent` | `components/WaitlistForm.tsx` |
| `other_state_selected_v1` | `components/OfferTool.tsx` |
| `other_metro_selected_v1` | `components/OfferTool.tsx` |
| `offer_tool_debt_enabled` | `components/OfferTool.tsx` |
| `offer_tool_assumptions_opened` | `components/OfferTool.tsx` |
| `rent_tool_leap_cta_clicked` | `components/OfferTool.tsx` |
| `rent_tool_feedback_submitted` | `components/ToolFeedbackQuestionnaire.tsx` |
| `market_rent_loaded_v1` / `market_rent_unavailable_v1` | `components/ResultsCards.tsx` |

---

## Leap Tool (`/leap-impact-simulator`)

| Event | Location |
|-------|----------|
| `leap_impact_viewed` | `app/leap-impact-simulator/page.tsx` |
| `landing_cta_click_show_next_move` | `components/LeapImpactTool.tsx` |
| `leap_impact_calculated` | `components/LeapImpactTool.tsx` |
| `results_viewed` | `components/LeapImpactTool.tsx` |
| `leap_impact_email_submitted` | `components/LeapImpactTool.tsx` |
| `leap_email_submit_success` | `components/LeapImpactTool.tsx` |
| `full_stack_expand_clicked` | `components/LeapImpactTool.tsx` |
| `leap_stack_unlock_clicked` | `components/LeapImpactTool.tsx` |
| `leap_redirect_to_allocator` | `components/LeapImpactTool.tsx` |
| `leap_impact_feedback_submitted` | `components/ToolFeedbackQuestionnaire.tsx` |

---

## Changes Made

- Removed Day-0 Cash A/B test (always show upfront cash number)
- Deleted `Day0CashEmailModal.tsx`, `lib/abTest.ts`
- Removed `leap_stack_preview_expanded` from docs (never fired)
- Deprecated `GA4_AB_TEST_*.md` (historical reference only)
