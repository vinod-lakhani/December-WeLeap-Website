# GA4 Event Names for Rent Tool

This document lists all the GA4 event names that are tracked in the rent tool for easy reference when viewing Google Analytics reports.

## Event Names

### 1. `rent_tool_page_view`
- **When**: Fires once when the user loads the rent tool page
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`

### 2. `hero_cta_click`
- **When**: User clicks the "See my rent reality" button (the main CTA)
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`

### 3. `scrolled_past_how_it_works`
- **When**: User scrolls past the "How it works" section (fires once)
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`

### 4. `rent_form_start`
- **When**: User first interacts with any form field (focus/typing) - fires once
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`

### 5. `rent_form_submit`
- **When**: User clicks "See my rent reality" and the form is submitted
- **Parameters**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
  - `salary_bucket`: `<60k`, `60_80k`, `80_100k`, `100_150k`, `150k_plus`
  - `city_tier`: `tier_1`, `tier_2`, `other`, `unknown`
  - `days_until_start_bucket`: `<14`, `14_30`, `30_60`, `60_plus`, `unknown`
  - `rent_ratio_bucket`: `<25`, `25_35`, `35_45`, `45_plus`, `unknown`

### 6. `playbook_generated`
- **When**: After successful tax calculation and playbook generation
- **Parameters**: Same as `rent_form_submit` (all bucketed parameters)

### 7. `playbook_email_sent`
- **When**: After successfully sending the email with PDF attachment
- **Parameters**: Same as `rent_form_submit` (all bucketed parameters)

## Optional Events (Not Yet Implemented)

### 8. `playbook_pdf_opened`
- **When**: User clicks a "View PDF" link (if added)

### 9. `playbook_pdf_downloaded`
- **When**: User downloads the PDF (if added)

## How to View Events in Google Analytics

### Realtime View (30-60 seconds delay)
1. Go to **Reports** → **Realtime**
2. Scroll to **Event count by Event name** section
3. Look for the event names listed above

### Events Explorer
1. Go to **Reports** → **Engagement** → **Events**
2. Events will appear here after 24-48 hours
3. Click on any event name to see details

### Debug Mode (Immediate - Browser Console)
1. Add `NEXT_PUBLIC_DEBUG_ANALYTICS=true` to `.env.local`
2. Open browser DevTools → Console
3. You'll see events logged immediately like:
   ```
   [Analytics] rent_tool_page_view { page: '/how-much-rent-can-i-afford', tool_version: 'rent_tool_v1' }
   ```

## Typical User Flow & Events

1. User lands on page → `rent_tool_page_view`
2. User scrolls past "How it works" → `scrolled_past_how_it_works`
3. User starts filling form → `rent_form_start`
4. User clicks "See my rent reality" → `hero_cta_click` → `rent_form_submit`
5. Calculation succeeds → `playbook_generated`
6. User enters email and submits → `playbook_email_sent`

## Funnel Analysis

Use these events in GA4 to create a funnel:
1. `rent_tool_page_view` (all users)
2. `scrolled_past_how_it_works` (engaged users)
3. `rent_form_start` (form engaged)
4. `rent_form_submit` (completed form)
5. `playbook_generated` (got results)
6. `playbook_email_sent` (conversion)
