# Analytics Funnel Reports

Guide for creating and interpreting two key conversion funnels in GA4 and Vercel Analytics.

---

## Overview

| Funnel | Description | Segment |
|--------|-------------|---------|
| **Funnel 1** | Rent tool → Leap tool → Full plan completion | Users who clicked from rent to leap |
| **Funnel 2** | Leap tool entry → Full plan completion | All users who enter the leap flow |

**Completion** = User reaches the allocator summary and submits early access (or saves plan).

---

## Funnel 1: Rent Tool → Leap Tool → Completion

Measures users who start in the rent tool, click through to the leap tool, and complete the full plan.

### Event Sequence

| Step | Event | Params | Description |
|------|-------|--------|-------------|
| 1 | `rent_tool_page_view` | `page`, `tool_version` | User lands on rent tool |
| 2 | `rent_form_submit` | `page`, `tool_version`, `salary_bucket`, etc. | User completes rent calculation |
| 3 | `rent_tool_leap_cta_clicked` | `page` | User clicks "Build my full money plan" → navigates to leap |
| 4 | `leap_impact_viewed` | `page` | User lands on leap tool (with `?src=rent` in URL) |
| 5 | `leap_impact_calculated` | `page`, `salary`, `state`, etc. | User completes leap calculation |
| 6 | `results_viewed` | `page` | User sees next-move results |
| 7 | `leap_redirect_to_allocator` | `intent` | User clicks "Build my full plan" → navigates to allocator |
| 8 | `allocator_prefill_loaded` | `source: 'rent'`, `intent` | User lands on allocator (prefilled) |
| 9 | `leap_stack_started` | `source: 'rent'` | Allocator stack initialized |
| 10 | `allocator_stack_completed` | — | User completes all 5 steps |
| 11 | `early_access_submitted` | `source`, etc. | User submits email for early access |

### GA4 Setup: Funnel Exploration

1. **Explore** → **Funnel exploration**
2. **Steps** (add in order):
   - `rent_tool_page_view`
   - `rent_form_submit`
   - `rent_tool_leap_cta_clicked`
   - `leap_impact_viewed`
   - `leap_impact_calculated`
   - `results_viewed`
   - `leap_redirect_to_allocator`
   - `allocator_prefill_loaded` (add filter: `source` = `rent`)
   - `leap_stack_started` (add filter: `source` = `rent`)
   - `allocator_stack_completed`
   - `early_access_submitted`

3. **Segment**: Create "Rent-to-Leap users" = Users who triggered `rent_tool_leap_cta_clicked` (in same session or ever). Apply to exploration.

4. **Breakdown** (optional): By `source` on allocator events to confirm rent attribution.

### Simplified Funnel (5 steps)

For a quicker view, use these core steps:

1. `rent_tool_page_view`
2. `rent_tool_leap_cta_clicked`
3. `leap_impact_calculated`
4. `allocator_prefill_loaded` (filter: `source` = `rent`)
5. `early_access_submitted`

---

## Funnel 2: Leap Tool Entry → Completion

Measures all users who enter the leap flow (from any source) and complete the full plan.

### Event Sequence

| Step | Event | Params | Description |
|------|-------|--------|-------------|
| 1 | `leap_impact_viewed` | `page` | User lands on leap tool |
| 2 | `landing_cta_click_show_next_move` | `page` | User clicks "Check my setup" (step 0 → 1) |
| 3 | `leap_impact_calculated` | `page`, `salary`, `state`, etc. | User completes calculation |
| 4 | `results_viewed` | `page` | User sees next-move results |
| 5 | `leap_redirect_to_allocator` | `intent` | User clicks "Build my full plan" |
| 6 | `allocator_prefill_loaded` | `source`, `intent` | User lands on allocator |
| 7 | `leap_stack_started` | `source` | Allocator stack initialized |
| 8 | `allocator_stack_completed` | — | User completes all 5 steps |
| 9 | `early_access_submitted` | `source`, etc. | User submits email |

**Note:** Users can also enter the allocator directly (e.g. from email link). In that case, steps 1–5 may be skipped and the funnel starts at `allocator_prefill_loaded`.

### GA4 Setup: Funnel Exploration

1. **Explore** → **Funnel exploration**
2. **Steps** (add in order):
   - `leap_impact_viewed`
   - `leap_impact_calculated`
   - `results_viewed`
   - `leap_redirect_to_allocator`
   - `allocator_prefill_loaded`
   - `leap_stack_started`
   - `allocator_stack_completed`
   - `early_access_submitted`

3. **Breakdown** (optional): By `source` on `allocator_prefill_loaded` to see rent vs. leap_impact_tool vs. direct.

### Simplified Funnel (5 steps)

1. `leap_impact_viewed`
2. `leap_impact_calculated`
3. `leap_redirect_to_allocator`
4. `allocator_stack_completed`
5. `early_access_submitted`

---

## Source Attribution

| Source | When | `allocator_prefill_loaded.source` |
|--------|------|-----------------------------------|
| Rent tool | User clicked "Build my full money plan" from rent results | `rent` |
| Leap tool (direct) | User landed on leap-impact-simulator directly | `leap_impact_tool` |
| Email / other | User arrived via email link or external URL | varies |

---

## Vercel Analytics

Vercel Analytics stores custom events. To build funnels:

1. **Vercel Dashboard** → **Analytics** → **Events**
2. Filter by event name to see counts.
3. Vercel does not support multi-step funnel visualization natively. Use GA4 for funnel reports, or export event data for analysis.

---

## Key Metrics to Watch

| Metric | Funnel 1 | Funnel 2 |
|--------|----------|----------|
| **Drop-off at rent → leap** | `rent_tool_leap_cta_clicked` / `rent_form_submit` | — |
| **Drop-off at leap → allocator** | `leap_redirect_to_allocator` / `results_viewed` | Same |
| **Drop-off at allocator completion** | `allocator_stack_completed` / `allocator_prefill_loaded` | Same |
| **Conversion rate** | `early_access_submitted` / `rent_tool_page_view` | `early_access_submitted` / `leap_impact_viewed` |

---

## Event Reference

See `docs/ANALYTICS_RENT_AND_LEAP_TOOLS.md` and `lib/analytics.ts` for full event documentation.
