# GA4 Events Explained - Complete Guide

This document explains every event you see in your Google Analytics 4 dashboard, including both automatic GA4 events and your custom rent tool events.

---

## 🔵 Standard GA4 Events (Automatic)

These events are automatically tracked by Google Analytics 4 without any custom code. They fire for all pages on your site.

### 1. `page_view` ✅ (Currently Selected)
- **What it is**: Automatic GA4 event that fires every time a page loads
- **When it fires**: Immediately when someone visits any page on your site
- **What it tells you**: 
  - Total number of page views
  - Most visited pages
  - Page traffic patterns
- **Your site**: Fires for ALL pages (homepage, rent tool, etc.)
- **Why it's checked**: GA4 often pre-selects high-volume standard events

### 2. `scroll` ✅ (Currently Selected)
- **What it is**: Automatic GA4 event that fires when users scroll down a page
- **When it fires**: When a user scrolls at least 90% down a page
- **What it tells you**: 
  - User engagement level
  - Which pages users are actually reading (not just bouncing)
  - Content effectiveness
- **Your site**: Fires on any page where users scroll
- **Note**: This is GA4's enhanced measurement feature (enabled by default)

### 3. `user_engagement` ✅ (Currently Selected)
- **What it is**: Automatic GA4 event that measures active user engagement
- **When it fires**: When a user:
  - Scrolls on a page
  - Clicks on a link
  - Watches a video (if configured)
  - Spends at least 10 seconds on a page
- **What it tells you**: 
  - Overall site engagement
  - Active vs. passive visitors
  - User behavior quality
- **Your site**: Fires on any page with user interaction

### 4. `session_start` ✅ (Currently Selected)
- **What it is**: Automatic GA4 event that fires when a new session begins
- **When it fires**: 
  - When a user first visits your site
  - When a user returns after 30 minutes of inactivity
  - When a user comes from a different campaign/source
- **What it tells you**: 
  - Number of new sessions
  - Session frequency
  - Returning vs. new visitors
- **Your site**: Fires once per session, across all pages

### 5. `form_start` ✅ (Currently Selected)
- **What it is**: Automatic GA4 event for form interactions (Enhanced Measurement)
- **When it fires**: When a user first interacts with any form field (focus/click)
- **What it tells you**: 
  - Form engagement (how many people start forms)
  - Which forms are most popular
- **Your site**: May fire on your rent tool form (but we also track `rent_form_start` specifically)
- **Note**: This is GA4's automatic form tracking - we also have a custom `rent_form_start` event

### 6. `first_visit` ⬜ (Not Currently Selected)
- **What it is**: Automatic GA4 event for brand new users
- **When it fires**: The very first time a user visits your site (in any session, ever)
- **What it tells you**: 
  - Number of completely new visitors
  - New user acquisition rate
  - First-time visitor behavior
- **Your site**: Fires once per unique user, ever
- **Why it's unchecked**: Lower volume event (only fires once per user), so GA4 doesn't pre-select it

---

## 🟢 Custom Rent Tool Events (Your Implementation)

These are custom events we specifically implemented to track the rent tool user journey. They only fire on the rent tool page (`/how-much-rent-can-i-afford`).

### 7. `scrolled_past_how_it_works` ⬜ (Not Currently Selected)
- **What it is**: Custom event that tracks when users scroll past the "How it works" section
- **When it fires**: Once when the user scrolls down enough that the "How it works" section enters the viewport
- **Where in code**: `app/how-much-rent-can-i-afford/page.tsx` (uses IntersectionObserver)
- **What it tells you**: 
  - Engagement level: Did users read the "How it works" section?
  - Content effectiveness: Is the section positioned well?
  - User interest: Are people scrolling to learn more?
- **Funnel position**: Second step (after page view, before form interaction)
- **Why it's unchecked**: Lower volume (only fires if users scroll past that specific section)

### 8. `rent_form_start` ⬜ (Not Currently Selected)
- **What it is**: Custom event that tracks when users start interacting with the rent calculation form
- **When it fires**: The first time a user focuses on or types in ANY form field (salary, city, date, etc.)
- **Where in code**: `components/OfferTool.tsx` (tracks first focus/input)
- **Parameters included**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
- **What it tells you**: 
  - Form engagement: How many people actually start filling it out?
  - Drop-off point: Users who viewed but didn't start vs. started but didn't finish
  - Intent level: Serious vs. casual browsers
- **Funnel position**: Third step (key engagement metric)
- **Note**: This is different from GA4's automatic `form_start` - ours is specific to the rent tool
- **Why it's unchecked**: Lower volume than standard events

### 9. `hero_cta_click` ⬜ (Not Currently Selected)
- **What it is**: Custom event that tracks clicks on the main "See my rent reality" button
- **When it fires**: When user clicks the green CTA button in the hero section
- **Where in code**: `components/OfferTool.tsx` (in `handleCalculate` function)
- **Parameters included**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
- **What it tells you**: 
  - CTA effectiveness: Is the button compelling?
  - Click-through rate: How many people clicked vs. viewed?
  - Conversion intent: Strong signal of interest
- **Funnel position**: Fires at the same time as form submission (it's the button that triggers submission)
- **Note**: This fires every time someone clicks the CTA, even if form validation fails
- **Why it's unchecked**: Lower volume than standard events

### 10. `playbook_generated` ⬜ (Not Currently Selected)
- **What it is**: Custom event that tracks successful playbook/calculation completion
- **When it fires**: After the tax calculation API succeeds and results are displayed to the user
- **Where in code**: `components/OfferTool.tsx` (after successful tax API response)
- **Parameters included**:
  - `page`: `/how-much-rent-can-i-afford`
  - `tool_version`: `rent_tool_v1`
  - `salary_bucket`: `<60k`, `60_80k`, `80_100k`, `100_150k`, `150k_plus`
  - `city_tier`: `tier_1`, `tier_2`, `other`, `unknown`
  - `days_until_start_bucket`: `<14`, `14_30`, `30_60`, `60_plus`, `unknown`
  - `rent_ratio_bucket`: `<25`, `25_35`, `35_45`, `45_plus`, `unknown`
- **What it tells you**: 
  - Success rate: How many form submissions resulted in playbooks?
  - Technical health: API failures vs. successes
  - User segments: Which salary ranges, cities, etc. are using the tool?
- **Funnel position**: Fifth step (key conversion milestone - user got value!)
- **Why it's unchecked**: Lower volume (only fires on successful calculations)

---

## 📊 Additional Custom Events (Not Shown in Your List Yet)

These events should also appear in GA4 once they fire. They may not show up until users complete the full journey.

### `rent_tool_page_view`
- **What it is**: Custom event that specifically tracks visits to the rent tool page
- **When it fires**: Once when the rent tool page loads
- **Where in code**: `app/how-much-rent-can-i-afford/page.tsx`
- **Why we have it**: More specific than automatic `page_view` - filters to just the rent tool
- **Status**: Should appear in GA4 (we just fixed it to wait for gtag)

### `rent_form_submit`
- **What it is**: Custom event that tracks form submission
- **When it fires**: When user clicks "See my rent reality" and form passes validation
- **Where in code**: `components/OfferTool.tsx` (in `handleCalculate` function)
- **Parameters**: Same bucketed parameters as `playbook_generated`
- **What it tells you**: Form completion rate, validation issues

### `playbook_email_sent`
- **What it is**: Custom event that tracks successful email delivery
- **When it fires**: After the email with PDF attachment is successfully sent via Resend API
- **Where in code**: 
  - Backend: `app/api/email-plan/route.ts` (after successful email send)
  - Frontend: `components/WaitlistForm.tsx` (as backup)
- **Parameters**: Same bucketed parameters as `playbook_generated`
- **What it tells you**: Final conversion metric - email delivery success
- **Funnel position**: Final step (ultimate conversion!)

---

## 🎯 Event Funnel Flow

Here's the typical user journey and which events fire:

```
1. User lands on rent tool page
   → `page_view` (automatic)
   → `rent_tool_page_view` (custom) ✓
   → `session_start` (automatic, if new session)

2. User scrolls down
   → `scroll` (automatic)
   → `user_engagement` (automatic)

3. User scrolls past "How it works" section
   → `scrolled_past_how_it_works` (custom) ✓

4. User clicks in a form field
   → `form_start` (automatic)
   → `rent_form_start` (custom) ✓

5. User clicks "See my rent reality" button
   → `hero_cta_click` (custom) ✓
   → `rent_form_submit` (custom)

6. Tax calculation succeeds
   → `playbook_generated` (custom) ✓

7. User enters email and submits
   → `playbook_email_sent` (custom) ← ULTIMATE CONVERSION!
```

---

## 💡 Why Some Events Are Checked vs. Unchecked

**Checked events** (✅):
- High volume (fire frequently)
- Standard GA4 events (automatic)
- GA4 pre-selects these by default
- Useful for general site analytics

**Unchecked events** (⬜):
- Lower volume (custom events, specific actions)
- More specific to rent tool funnel
- You need to manually check them for funnel analysis
- Critical for tracking your conversion funnel

---

## 📈 How to Use These Events

### For General Site Analytics:
- Focus on checked events: `page_view`, `scroll`, `user_engagement`, `session_start`

### For Rent Tool Funnel Analysis:
- Use the custom unchecked events in order:
  1. `rent_tool_page_view` (or `page_view` filtered to rent tool page)
  2. `scrolled_past_how_it_works`
  3. `rent_form_start`
  4. `rent_form_submit`
  5. `playbook_generated`
  6. `playbook_email_sent` (conversion!)

### For User Segmentation:
- Use events with parameters (`playbook_generated`, `rent_form_submit`) to analyze:
  - Salary ranges
  - City tiers
  - Time until job start
  - Rent-to-income ratios

---

## 🔍 Where to See These Events

1. **Realtime View**: 
   - Reports → Realtime
   - Shows events as they happen (30-60 second delay)
   - Great for testing

2. **Events Report**: 
   - Reports → Engagement → Events
   - Full historical data (24-48 hour delay)
   - See event counts, parameters, trends

3. **Explorations**: 
   - Explore → Funnel exploration
   - Use unchecked custom events to build your conversion funnel

---

## ❓ Common Questions

**Q: Why do I see `form_start` AND `rent_form_start`?**
A: `form_start` is automatic GA4 tracking. `rent_form_start` is our custom event that's specific to the rent tool and fires at the same time. You can use either, but `rent_form_start` is more specific.

**Q: Why doesn't `rent_tool_page_view` appear in the list?**
A: It should! We just fixed a timing issue. If it still doesn't appear, check:
- Is cookie consent accepted? (GA4 only loads after consent)
- Wait 24-48 hours for full indexing
- Check Realtime view first

**Q: Which events should I use for my funnel?**
A: Use the custom unchecked events in order:
1. `rent_tool_page_view` (or filtered `page_view`)
2. `scrolled_past_how_it_works`
3. `rent_form_start`
4. `rent_form_submit`
5. `playbook_generated`
6. `playbook_email_sent`

**Q: What if an event has 0 events?**
A: It means no users have triggered it yet. This is normal for:
- New events (just implemented)
- Rare events (only fire in specific circumstances)
- Events that require the full user journey (like `playbook_email_sent`)

---

## 📚 Additional Resources

- See `GA4_EVENT_NAMES.md` for technical implementation details
- See `GA4_CUSTOM_REPORTS.md` for how to build funnels with these events
- Check `lib/analytics.ts` for the tracking code
- Check `lib/buckets.ts` for how parameters are bucketed for privacy
