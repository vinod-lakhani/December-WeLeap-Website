# GA4 A/B Test Events - Day-0 Cash Reality Experiment

This document lists all GA4 events for the Day-0 Cash Reality A/B test experiment.

## A/B Test Setup

- **Experiment**: Day-0 Cash Reality
- **Variant A (Control)**: Current production behavior - shows exact Day-0 cash number immediately
- **Variant B (Test)**: New behavior - shows preview/bucket, gates exact number behind email capture
- **Assignment**: 50/50 split, persisted in localStorage
- **Override**: Query param `?ab_day0=A` or `?ab_day0=B` for QA

---

## Event Names & Triggers

### Page & Experiment Setup

#### `rent_tool_page_view_v2`
- **When**: Fires once when the rent tool page loads
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `app/how-much-rent-can-i-afford/page.tsx`

---

### Day-0 Cash Module Events

#### `day0_cash_module_view`
- **When**: Fires once when Day-0 Cash module becomes visible (IntersectionObserver)
- **Parameters**:
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `components/ResultsCards.tsx`
- **Note**: For Variant A, also fires `day0_cash_number_revealed` immediately when module is viewed

#### `day0_cash_cta_click`
- **When**: User clicks the CTA in Day-0 Cash module
- **Parameters**:
  - `ab_day0_cash_variant`: `A` or `B`
  - `cta_label`: 
    - Variant A: `"View assumptions"` (opens accordion)
    - Variant B: `"Get my Day-0 Cash Plan"` (opens email modal)
- **Location**: `components/ResultsCards.tsx`

#### `day0_cash_email_modal_open`
- **When**: Email modal opens due to Day-0 Cash CTA
- **Parameters**:
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `components/Day0CashEmailModal.tsx`
- **Note**: 
  - Variant A: Only fires if current flow opens email modal from this CTA
  - Variant B: Always fires (modal opens from "Get my Day-0 Cash Plan")

#### `day0_cash_email_submit`
- **When**: User submits email via Day-0 Cash modal
- **Parameters**:
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `components/Day0CashEmailModal.tsx`
- **Privacy**: NO email address sent to analytics (no PII)

#### `day0_cash_number_revealed`
- **When**: Exact Day-0 cash number is shown to user
- **Parameters**:
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `components/ResultsCards.tsx`
- **Variant Behavior**:
  - **Variant A**: Fires when module becomes visible (number shown by default)
  - **Variant B**: Fires only after successful email submit AND exact number is displayed

---

### Core Funnel Events (v2)

#### `rent_form_start_v2`
- **When**: User first interacts with any form field (focus/typing) - fires once
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
  - `ab_day0_cash_variant`: `A` or `B`
- **Location**: `components/OfferTool.tsx`

#### `rent_form_submit_v2`
- **When**: User clicks "See my rent reality" and form is submitted
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
  - `ab_day0_cash_variant`: `A` or `B`
  - `salary_bucket`: `<60k`, `60_80k`, `80_100k`, `100_150k`, `150k_plus`
  - `city_tier`: `tier_1`, `tier_2`, `other`, `unknown`
  - `days_until_start_bucket`: `<14`, `14_30`, `30_60`, `60_plus`, `unknown`
  - `rent_ratio_bucket`: `<25`, `25_35`, `35_45`, `45_plus`, `unknown`
- **Location**: `components/OfferTool.tsx`

#### `playbook_generated_v2`
- **When**: After successful tax calculation and playbook generation
- **Parameters**: Same as `rent_form_submit_v2` (all bucketed parameters + variant)
- **Location**: `components/OfferTool.tsx`

#### `playbook_email_sent_v2`
- **When**: After successfully sending the email with PDF attachment
- **Parameters**: Same as `rent_form_submit_v2` (all bucketed parameters + variant)
- **Location**: `components/WaitlistForm.tsx`

---

## Variant Behavior Summary

### Variant A (Control) - Current Behavior
- ✅ Shows exact Day-0 cash number immediately
- ✅ "View assumptions" CTA opens accordion
- ✅ All existing email/playbook flows unchanged
- ✅ Fires `day0_cash_number_revealed` when module is visible

### Variant B (Test) - New Behavior
- 🧪 Shows preview/bucket: "Likely $Xk–$Yk upfront" + explanation
- 🧪 "Get my Day-0 Cash Plan" CTA opens email modal
- 🧪 After email submit: Reveals exact number + plan details
- 🧪 Fires `day0_cash_number_revealed` only after email submit

---

## Privacy-Safe Parameters

All events use bucketed/non-PII parameters:
- ✅ `ab_day0_cash_variant`: `A` or `B` (no user identification)
- ✅ `salary_bucket`: Ranges like `<60k`, `60_80k`, etc.
- ✅ `city_tier`: `tier_1`, `tier_2`, `other`, `unknown` (no city names)
- ✅ `rent_ratio_bucket`: Percentages like `<25`, `25_35`, etc.
- ✅ `days_until_start_bucket`: Time ranges like `<14`, `14_30`, etc.

**Never sent:**
- ❌ Raw salary amounts
- ❌ Email addresses
- ❌ City names
- ❌ Exact dates

---

## How to View Events in GA4

### Realtime View (30-60 seconds delay)
1. Go to **Reports** → **Realtime**
2. Scroll to **Event count by Event name** section
3. Look for events with `_v2` suffix and `day0_cash_` prefix

### Events Explorer
1. Go to **Reports** → **Engagement** → **Events**
2. Events will appear after 24-48 hours
3. Filter by event name to see A/B test events

### Funnel Analysis
Create a funnel in **Explore** → **Funnel exploration**:
1. `rent_tool_page_view_v2` (all users)
2. `day0_cash_module_view` (users who saw Day-0 module)
3. `day0_cash_cta_click` (users who clicked CTA)
4. `day0_cash_email_submit` (Variant B: users who submitted email)
5. `day0_cash_number_revealed` (users who saw exact number)

Breakdown by `ab_day0_cash_variant` to compare Variant A vs B.

---

## Testing

### QA Override
- Add `?ab_day0=A` to URL to force Variant A
- Add `?ab_day0=B` to URL to force Variant B
- Override persists in localStorage

### Debug Mode
- Set `NEXT_PUBLIC_DEBUG_ANALYTICS=true` in `.env.local`
- Check browser console for event logs
- Events will show: `[Analytics] event_name { params }`

---

## Implementation Files

- `lib/abTest.ts` - Variant assignment logic
- `lib/analytics.ts` - Event tracking utility (already exists, updated)
- `components/ResultsCards.tsx` - Day-0 Cash module with A/B test logic
- `components/Day0CashEmailModal.tsx` - Email modal for Variant B
- `components/OfferTool.tsx` - Form tracking (updated to v2 events)
- `components/WaitlistForm.tsx` - Playbook email tracking (updated to v2 events)
- `app/how-much-rent-can-i-afford/page.tsx` - Page view tracking (updated to v2)

---

## Notes

- All v2 events include `ab_day0_cash_variant` parameter
- Old events (without `_v2`) still fire for backward compatibility
- Variant assignment happens on first page load and persists
- Events fire to both GA4 and Vercel Analytics
