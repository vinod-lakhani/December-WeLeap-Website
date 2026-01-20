# GA4 Data Discrepancies: Events Report vs. Funnel Exploration

## Why Numbers Don't Match

It's **completely normal** to see different numbers between the Events report and Funnel exploration, even for the same date range. Here's why:

---

## Key Differences

### 1. **What They Count**

#### Events Report
- **Counts**: All events that occurred (event count)
- **Perspective**: "How many times did this event fire?"
- **Users**: Unique users who triggered the event (any time during the date range)

#### Funnel Exploration
- **Counts**: Users who completed the sequence
- **Perspective**: "How many users went from Step 1 → Step 2 → Step 3?"
- **Users**: Users who completed each step **in order**

---

## Example: Your Data

### Events Report Shows:
- `page_view`: **52 event count**, **7 total users**
- `rent_form_start`: **4 event count**, **1 total user**
- `rent_form_submit`: **3 event count**, **1 total user**

### Funnel Exploration Shows:
- Step 1 (Rent Tool Page View): **5 users**
- Step 3 (Form Started): **1 user**
- Step 4 (Form Submitted): **1 user**

---

## Why the Numbers Are Different

### Reason 1: Multiple Events Per User

**Events Report**: Counts **all events**
- If a user visits the page 5 times, `page_view` fires 5 times
- If 7 users visit, and some visit multiple times, you get 52 total `page_view` events

**Funnel Exploration**: Counts **unique users** who completed the sequence
- Each user only counts once, even if they visit multiple times
- Only counts users who completed Step 1 → Step 2 → Step 3 → etc. **in order**

**Example:**
- User A visits 10 times → Events report: 10 `page_view` events, 1 user
- Funnel: User A counts as 1 user (if they complete the sequence)

---

### Reason 2: Sequential Logic

**Events Report**: Counts events **independently**
- Doesn't care about order
- Doesn't care if users completed previous steps

**Funnel Exploration**: Counts users who completed steps **in sequence**
- User must complete Step 1 before Step 2 counts
- If a user skips a step, they drop out of the funnel

**Example:**
- User A: `page_view` → `rent_form_start` → `rent_form_submit` ✅ (counts in funnel)
- User B: `page_view` → (leaves) ❌ (doesn't count in Step 2 of funnel)
- User C: `rent_form_start` (never viewed page) ❌ (doesn't count in funnel at all)

---

### Reason 3: Date Range Processing

**Events Report**: Uses event timestamp
- Counts events that occurred within the date range
- Each event has its own timestamp

**Funnel Exploration**: Uses session/user journey logic
- May count users based on when they **started** the funnel
- If a user starts on Jan 18 but completes Step 6 on Jan 19, it depends on funnel settings

**Example:**
- Funnel set to "Users who started funnel in date range"
- Events report counts all events in date range
- If a user crosses midnight, numbers can differ

---

### Reason 4: Different Event Names

**Your Funnel Uses:**
- Step 1: `rent_tool_page_view` (custom event)

**Events Report Shows:**
- `page_view` (automatic GA4 event) - 52 events
- `rent_tool_page_view` - might be lower (only fires on rent tool page)

**Why This Matters:**
- `page_view` fires on **all pages** (homepage, rent tool, etc.)
- `rent_tool_page_view` fires **only on the rent tool page**
- If your funnel uses `rent_tool_page_view` but Events report shows `page_view`, they're measuring different things!

---

## How to Reconcile the Numbers

### Option 1: Check Event Names Match

**In your Funnel:**
- Step 1: Should use `rent_tool_page_view` (not `page_view`)
- Step 2: Should use `scrolled_past_how_it_works`
- Step 3: Should use `rent_form_start`
- Step 4: Should use `rent_form_submit`
- Step 5: Should use `playbook_generated`
- Step 6: Should use `playbook_email_sent`

**In Events Report:**
- Look for `rent_tool_page_view` (not `page_view`)
- Compare user counts, not event counts

---

### Option 2: Use Same Metrics

**To Compare Apples to Apples:**

1. **In Events Report:**
   - Look at **"Total users"** column (not "Event count")
   - Filter to only your custom events: `rent_tool_page_view`, `rent_form_start`, etc.

2. **In Funnel Exploration:**
   - Check what metric it's using (usually "Users" at the top)
   - Make sure it's set to "Users" not "Sessions" or "Events"

---

### Option 3: Check Funnel Configuration

**Funnel Settings to Verify:**

1. **Funnel type**: 
   - "Open funnel" = Users can enter at any step (more lenient)
   - "Closed funnel" = Users must start at Step 1 (stricter)
   - **Your funnel should be "Closed"** to match Events report

2. **Lookback window**:
   - How long between steps?
   - Default is usually "Same session" or "30 days"
   - If set to "Same session", users who complete steps across multiple sessions won't count

3. **Step conditions**:
   - Make sure event names match exactly (case-sensitive!)
   - Check for any additional filters that might exclude users

---

## Expected Behavior Based on Your Data

### Events Report Analysis:
- **52 `page_view` events from 7 users**
  - Average: 7.4 page views per user
  - Some users visited multiple times or viewed multiple pages

- **4 `rent_form_start` events from 1 user**
  - Same user started the form 4 times (maybe tried different inputs)

- **3 `rent_form_submit` events from 1 user**
  - Same user submitted the form 3 times

### Funnel Analysis:
- **5 users** viewed the rent tool page (`rent_tool_page_view`)
- **3 users** scrolled past "How it works"
- **1 user** started the form
- **1 user** completed the full funnel

### Why These Make Sense Together:
1. Events report shows **more page views** because:
   - It counts `page_view` (all pages), not just `rent_tool_page_view`
   - It counts multiple visits per user
   - It counts all events, not just sequential ones

2. Funnel shows **fewer users** because:
   - It only counts users who completed the sequence
   - It counts each user once (even if they visited multiple times)
   - It requires users to go through steps in order

---

## How to Debug

### Step 1: Verify Event Names
1. In Events report, note which event names have data
2. In Funnel, check each step uses the exact same event name
3. Make sure you're comparing `rent_tool_page_view` to `rent_tool_page_view`, not `page_view`

### Step 2: Check Metrics
1. Events report: Use **"Total users"** column
2. Funnel: Make sure it's set to **"Users"** metric (check top-right)

### Step 3: Verify Filters
1. Events report: Add filter for `Event name` = your custom events only
2. Funnel: Check if there are any additional filters applied

### Step 4: Check Date Range Logic
1. Events report: Uses event timestamp
2. Funnel: Check if it's "Users who started in range" vs "Users who completed in range"

---

## Best Practices

### For Accurate Funnel Analysis:
✅ Use **custom events** (not automatic `page_view`)
✅ Use **"Users"** metric (not "Event count")
✅ Use **"Closed funnel"** (users must start at Step 1)
✅ Check **"Same session"** lookback (or set appropriate window)
✅ Compare user counts, not event counts

### For Comparing Reports:
✅ Always compare **"Total users"** from Events report to **"Users"** from Funnel
✅ Filter Events report to only custom events used in funnel
✅ Use same date range (and check timezone settings)
✅ Verify event names match exactly

---

## Quick Reference: What Each Report Tells You

### Events Report:
- **Question**: "How many times did users trigger this event?"
- **Use for**: Overall activity, total engagement, event frequency
- **Metric**: Event count, Total users

### Funnel Exploration:
- **Question**: "How many users completed this sequence?"
- **Use for**: Conversion analysis, drop-off points, user journey
- **Metric**: Users (by step), Conversion rate, Abandonment rate

---

## Summary

**Different numbers = Normal!** ✅

The Events report and Funnel exploration answer different questions:
- **Events report**: "What events happened?" (event-focused)
- **Funnel**: "What journey did users take?" (user-focused)

To compare them:
1. Use **"Total users"** in Events report (not event count)
2. Filter Events report to only events used in funnel
3. Make sure event names match exactly
4. Understand that funnels require sequential completion

---

## Still Seeing Large Discrepancies?

If numbers are **very different** (e.g., Events shows 100 users, Funnel shows 5):

1. ✅ Check event names match exactly
2. ✅ Verify funnel is "Closed" (not "Open")
3. ✅ Check lookback window settings
4. ✅ Ensure users are completing steps in order
5. ✅ Verify date range includes all relevant events

See `GA4_CUSTOM_REPORTS.md` for funnel configuration details!
