# Analytics Events: Rent Tool & Leap Tool

Reference for all analytics events tracked in the Rent Tool (`/how-much-rent-can-i-afford`) and Leap Tool (`/leap-impact-simulator`).

---

## Overview

| Tool | Path | Event Count |
|------|------|-------------|
| **Rent Tool** | `/how-much-rent-can-i-afford` | 14 events |
| **Leap Tool** | `/leap-impact-simulator` | 9 events |

**Utility:** `lib/analytics.ts` → `track(eventName, params?, waitForGtagLoading?)`  
**Destinations:** Google Analytics 4 (GA4) + Vercel Analytics  
**Privacy:** No raw salary, email, or exact location. Bucketed values only where applicable.

---

## Rent Tool Events

### Page & Engagement

| Event | When | Params | Location |
|-------|------|--------|----------|
| `rent_tool_page_view` | Page load (500ms delay, waits for gtag) | `page`, `tool_version` | `app/how-much-rent-can-i-afford/page.tsx` |
| `scrolled_past_how_it_works` | User scrolls past "How it works" sentinel | `page`, `tool_version` | `app/how-much-rent-can-i-afford/page.tsx` |

### Form & Calculation

| Event | When | Params | Location |
|-------|------|--------|----------|
| `rent_form_start` | User first focuses/inputs any form field | `page`, `tool_version` | `components/OfferTool.tsx` |
| `hero_cta_click` | User clicks "See my rent reality" / Calculate button | `page`, `tool_version` | `components/OfferTool.tsx` |
| `rent_form_submit` | Calculation succeeds | `page`, `tool_version`, `salary_bucket`, `city_tier`, `days_until_start_bucket`, `rent_ratio_bucket` | `components/OfferTool.tsx` |
| `playbook_generated` | Playbook generated after successful calculation | `page`, `tool_version`, `salary_bucket`, `city_tier`, `days_until_start_bucket`, `rent_ratio_bucket` | `components/OfferTool.tsx` |

### Optional Inputs

| Event | When | Params | Location |
|-------|------|--------|----------|
| `other_state_selected_v1` | User selects state (when "Other" city chosen) | `page`, `stateName` | `components/OfferTool.tsx` |
| `other_metro_selected_v1` | User selects metro (when "Other" city chosen) | `page`, `stateName`, `regionName` | `components/OfferTool.tsx` |
| `offer_tool_debt_enabled` | User enables debt adjustment toggle | (none) | `components/OfferTool.tsx` |
| `offer_tool_assumptions_opened` | User opens assumptions accordion | (none) | `components/OfferTool.tsx` |

### Cross-Tool & Conversion

| Event | When | Params | Location |
|-------|------|--------|----------|
| `rent_tool_leap_cta_clicked` | User clicks "Run My Full Allocation Plan" | `page` | `components/OfferTool.tsx` |
| `playbook_email_sent` | User successfully sends playbook to email | `page`, `tool_version`, `salary_bucket`, `city_tier`, `days_until_start_bucket`, `rent_ratio_bucket` | `components/WaitlistForm.tsx` |

### Market Rent (ZORI)

| Event | When | Params | Location |
|-------|------|--------|----------|
| `market_rent_loaded_v1` | ZORI market rent data loads successfully | `page`, `locationMode`, `presetCity`, `stateName`, `regionName`, `tier`, `medianRent`, `marketLow`, `marketHigh` | `components/ResultsCards.tsx` |
| `market_rent_unavailable_v1` | ZORI fails or missing | `page`, `locationMode`, `presetCity`, `stateName`, `regionName` | `components/ResultsCards.tsx` |

### Feedback

| Event | When | Params | Location |
|-------|------|--------|----------|
| `rent_tool_feedback_submitted` | User submits feedback ("Did you find this tool useful?") | `page`, `feedback` (yes/not_sure/no) | `components/ToolFeedbackQuestionnaire.tsx` |
| `rent_share_card_downloaded` | User downloads Rent Share Card as PNG | `page` | `components/RentShareCard.tsx` |

---

## Leap Tool Events

### Page & Calculation

| Event | When | Params | Location |
|-------|------|--------|----------|
| `leap_impact_viewed` | Page load (waits for gtag) | `page` | `app/leap-impact-simulator/page.tsx` |
| `landing_cta_click_show_next_move` | User clicks "Show my highest-impact move" | `page` | `components/LeapImpactTool.tsx` |
| `leap_impact_calculated` | Calculation completes successfully | `page`, `salary`, `state`, `match_yesno`, `current_pct`, `match_cap_pct`, `match_rate_pct`, `recommended_pct`, `delta_30yr` | `components/LeapImpactTool.tsx` |
| `results_viewed` | User sees results (first time results render) | `page` | `components/LeapImpactTool.tsx` |

### Email & Plan

| Event | When | Params | Location |
|-------|------|--------|----------|
| `leap_impact_email_submitted` | User submits email to lock plan | `page` | `components/LeapImpactTool.tsx` |
| `leap_email_submit_success` | Email send succeeds | `intent`, `salary`, `state`, `current401kPct`, `recommended401kPct`, `delta30yr` | `components/LeapImpactTool.tsx` |

### Full Stack & MVP

| Event | When | Params | Location |
|-------|------|--------|----------|
| `full_stack_expand_clicked` | User clicks "See my full Leap stack" | `page` | `components/LeapImpactTool.tsx` |
| `leap_stack_unlock_clicked` | User clicks to unlock full stack (same as above) | `page` | `components/LeapImpactTool.tsx` |
| `leap_redirect_to_allocator` | User is redirected to allocator | `intent` (e.g. `unlock_full_stack`, `lock_plan`) | `components/LeapImpactTool.tsx` |
| `mvp_apply_clicked` | User clicks "Activate My Allocation (Join MVP)" | `source: 'leap_impact'` | `components/LeapImpactTool.tsx` |

### 401(k) Maxed

| Event | When | Params | Location |
|-------|------|--------|----------|
| `leap_401k_maxed_shown` | User sees "401(k) is maxed ✅" (already at IRS cap) | `page`, `salary`, `current401kPct`, `current401kAnnual`, `hasMatch`, `matchCapPct` | `components/LeapImpactTool.tsx` |
| `leap_401k_maxed_continue_to_fullstack_clicked` | User clicks "See my next best move" from maxed state | `page`, `salary`, `current401kPct` | `components/LeapImpactTool.tsx` |

### Feedback

| Event | When | Params | Location |
|-------|------|--------|----------|
| `leap_impact_feedback_submitted` | User submits feedback ("Does this next move make sense for you?") | `page`, `feedback` (yes/not_sure/no) | `components/ToolFeedbackQuestionnaire.tsx` |

---

## Typical Funnels

### Rent Tool
1. `rent_tool_page_view` → `scrolled_past_how_it_works` (optional) → `rent_form_start` → `hero_cta_click` → `rent_form_submit` → `playbook_generated` → `playbook_email_sent` (optional) or `rent_tool_leap_cta_clicked` (optional)

### Leap Tool
1. `leap_impact_viewed` → `landing_cta_click_show_next_move` → `leap_impact_calculated` → `results_viewed` → `leap_impact_email_submitted` + `leap_email_submit_success` (lock plan) **or** `full_stack_expand_clicked` + `leap_redirect_to_allocator` (unlock full stack) **or** `mvp_apply_clicked` (Join MVP)

---

## Bucketing (Rent Tool)

Rent tool uses bucketed values for privacy:

- `salary_bucket` — via `bucketSalary()` (e.g. `"50k-75k"`)
- `city_tier` — via `mapCityToTier()` (e.g. `"tier1"`)
- `days_until_start_bucket` — via `bucketDaysUntilStart()` (e.g. `"0-30"`)
- `rent_ratio_bucket` — via `bucketRentRatio()` (e.g. `"25-30"`)

See `lib/buckets.ts` for implementation.
