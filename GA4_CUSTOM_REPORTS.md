# GA4 Custom Reports Setup Guide

This guide walks you through creating custom reports in Google Analytics 4 to track your rent tool funnel and key metrics.

## 📊 Report 1: Rent Tool Conversion Funnel

This report tracks users from page load → email sent.

### Step 1: Access Explorations
1. Log into [Google Analytics](https://analytics.google.com)
2. Select **WeLeap** account → **Concierge Program** property
3. Click **Explore** in the left sidebar (or go to **Reports** → **Explore**)

### Step 2: Create Funnel Exploration
1. Click **+ Blank** (or click the **Template Gallery** and select **Funnel exploration**)
2. Name it: **"Rent Tool Conversion Funnel"**

### Step 3: Configure the Funnel Steps

**Important**: If an event doesn't appear in the dropdown, you can manually type it. GA4's autocomplete only shows events with significant volume, but all events are available if you type them.

#### Step 1: Page View
- **Step name**: `Page Loaded`
- **Step definition**: 
  - Click on **Dimension** dropdown → Search or type `Event name` → Select it
  - **Condition**: Select `exactly matches` from dropdown
  - **Value**: Type `rent_tool_page_view` (even if it doesn't appear in autocomplete)
  - **Note**: If `rent_tool_page_view` doesn't work, you can use `page_view` with an additional filter: add `AND` condition → `Page path` → `exactly matches` → `/how-much-rent-can-i-afford`
- Click **+ Add step**

#### Step 2: Scrolled Past How It Works
- **Step name**: `Engaged (Scrolled)`
- **Step definition**: 
  - Dimension: `Event name` (same as above)
  - Condition: `exactly matches`
  - **Value**: Type `scrolled_past_how_it_works` (manually type if not in dropdown)
- Click **+ Add step**

#### Step 3: Form Started
- **Step name**: `Form Started`
- **Step definition**: 
  - Dimension: `Event name`
  - Condition: `exactly matches`
  - **Value**: Type `rent_form_start` (manually type if not in dropdown)
- Click **+ Add step**

#### Step 4: Form Submitted
- **Step name**: `Form Submitted`
- **Step definition**: 
  - Dimension: `Event name`
  - Condition: `exactly matches`
  - **Value**: Type `rent_form_submit` (manually type if not in dropdown)
- Click **+ Add step**

#### Step 5: Playbook Generated
- **Step name**: `Playbook Generated`
- **Step definition**: 
  - Dimension: `Event name`
  - Condition: `exactly matches`
  - **Value**: Type `playbook_generated` (manually type if not in dropdown)
- Click **+ Add step**

#### Step 6: Email Sent (Conversion)
- **Step name**: `Email Sent` ⭐
- **Step definition**: 
  - Dimension: `Event name`
  - Condition: `exactly matches`
  - **Value**: Type `playbook_email_sent` (manually type if not in dropdown)
- Click **+ Add step**

### Step 4: Configure Settings
1. **Time period**: Select your desired date range (e.g., Last 30 days, Last 7 days)
2. **Open step settings** (⚙️ icon):
   - **Funnel visualization**: Select "Standard"
   - **Breakdown dimension**: (Optional) Select `City Tier` or `Salary Bucket` to see conversions by segment
     - **Note**: These dimensions won't appear until you register them as Custom Dimensions in GA4 Admin
     - See `GA4_CUSTOM_DIMENSIONS_SETUP.md` for step-by-step instructions
3. **Comparison**: (Optional) Add comparisons like:
   - Device category (Desktop vs Mobile)
   - City Tier (after registering custom dimension)
   - Salary Bucket (after registering custom dimension)

### Step 5: Configure Funnel Settings

**Important Funnel Settings:**

1. **Funnel type**: Select **"Closed funnel"**
   - This ensures users must start at Step 1 to be counted
   - Matches how you'd expect conversion funnels to work

2. **Lookback window**: Select **"Same session"** or **"30 days"**
   - "Same session": Users must complete steps within one session (stricter)
   - "30 days": Users can complete steps across multiple sessions (more lenient)
   - For rent tool, "Same session" is probably best (most users complete in one go)

3. **Metric**: Ensure it's set to **"Users"** (not "Sessions" or "Events")
   - This matches the "Total users" metric in Events reports
   - See `GA4_DATA_DISCREPANCIES.md` for why this matters

### Step 6: Verify Events are Working
Before saving, verify the funnel will have data:
1. Go to **Reports** → **Realtime** → **Event count by Event name**
2. Make sure you see these events in the last 30 minutes:
   - `rent_tool_page_view`
   - `rent_form_start` (if someone started filling the form)
   - `rent_form_submit` (if someone submitted)
   - `playbook_generated` (if someone got results)
   - `playbook_email_sent` (if someone received email)
3. If events don't show up, they may not have fired yet, but you can still create the funnel - it will show data as events occur

### Step 6: Save the Report
1. Click **Save** in the top right
2. Give it a name: **"Rent Tool Conversion Funnel"**
3. It will appear in your **Saved explorations** list

### Troubleshooting: Events Not in Dropdown
**If events don't appear in the autocomplete dropdown:**
1. **Type them manually** - GA4 allows you to type any event name, even if it's not in the dropdown
2. **Wait 24-48 hours** - New events need time to be fully indexed by GA4
3. **Check Realtime view first** - If you see the event in Realtime, it exists and can be typed manually
4. **Verify event names are exact** - Event names are case-sensitive and must match exactly:
   - ✅ `rent_tool_page_view` (correct)
   - ❌ `rentToolPageView` (wrong - wrong case)
   - ❌ `rent_tool_pageview` (wrong - missing underscore)

---

## 📈 Report 2: Event Performance Dashboard

A quick overview of all rent tool events and their performance.

### Step 1: Create Free Form Exploration
1. Click **+ Blank** → Select **Free form**
2. Name it: **"Rent Tool Events Dashboard"**

### Step 2: Configure Dimensions & Metrics

#### Variables Panel (Left Side):
1. **Dimensions** (drag these in):
   - `Event name`
   - `City Tier` (custom dimension - must register first, see `GA4_CUSTOM_DIMENSIONS_SETUP.md`)
   - `Salary Bucket` (custom dimension - must register first)
   - `Rent Ratio Bucket` (custom dimension - must register first)
   - `Days Until Start Bucket` (custom dimension - must register first)

2. **Metrics** (drag these in):
   - `Event count`
   - `Total users`
   - `Sessions`

#### Tab Settings (Right Side):
1. **Visualization**: Select "Table"
2. **Rows**: Drag `Event name` here
3. **Values**: 
   - Drag `Event count` → Rename to "Count"
   - Drag `Total users` → Rename to "Unique Users"
4. **Filters**: 
   - Click **+ Add filter**
   - Dimension: `Event name`
   - Condition: `matches regex`
   - Value: `^(rent_tool_page_view|hero_cta_click|scrolled_past_how_it_works|rent_form_start|rent_form_submit|playbook_generated|playbook_email_sent)$`
   - This filters to only show your rent tool events

### Step 3: Add Breakdowns
- Click **Rows** → Add `City tier` as a breakdown
- This shows event counts by city tier (Tier 1, Tier 2, etc.)

### Step 4: Save
- Click **Save** → Name: **"Rent Tool Events Dashboard"**

---

## 🎯 Report 3: Conversion Rate by User Segment

See which user segments convert best.

### Step 1: Create Cohort Exploration
1. Click **+ Blank** → Select **Cohort exploration**
2. Name it: **"Rent Tool Conversion by Segment"**

### Step 2: Configure Cohort Settings
1. **Cohort type**: Select "Standard cohort"
2. **Cohort granularity**: Select "Day" or "Week"
3. **Cohort identifier**: Select "First session date"

### Step 3: Configure Metrics
1. **Metrics to include**:
   - `playbook_email_sent` (as conversion event)
   - `rent_form_submit` (as engagement event)

2. **Breakdown dimension**: 
   - Add `City tier` or `Salary bucket` to compare segments

### Step 4: Save
- Click **Save** → Name: **"Rent Tool Conversion by Segment"**

---

## 📱 Report 4: Device & Browser Performance

See if mobile or desktop users convert better.

### Step 1: Create Free Form Exploration
1. Click **+ Blank** → Select **Free form**
2. Name it: **"Rent Tool Device Performance"**

### Step 2: Configure
1. **Dimensions**: 
   - `Device category`
   - `Browser`
   - `Event name`

2. **Metrics**:
   - `Event count`
   - `Total users`

3. **Visualization**: Table
4. **Rows**: `Device category` → `Browser`
5. **Columns**: `Event name`
6. **Values**: `Event count`

7. **Filters**:
   - `Event name` matches `playbook_email_sent` (or all rent tool events)

### Step 3: Save
- Click **Save** → Name: **"Rent Tool Device Performance"**

---

## 🚀 Quick Access: Custom Report Library

After creating these reports, you can:
1. Access them from **Explore** → **Saved explorations**
2. Share them with team members
3. Schedule email reports (click **Share** → **Schedule**)

---

## 📝 Event Parameter Deep Dive

To see detailed parameters for any event:

1. Go to **Reports** → **Engagement** → **Events**
2. Click on any event name (e.g., `rent_form_submit`)
3. Scroll down to **Event parameters**
4. You'll see:
   - `salary_bucket`: Salary ranges like `<60k`, `60_80k`, etc.
   - `city_tier`: `tier_1`, `tier_2`, `other`
   - `rent_ratio_bucket`: Rent-to-income ratios
   - `days_until_start_bucket`: Time until job start

---

## 💡 Pro Tips

1. **Set up Custom Alerts**:
   - Go to **Admin** → **Custom Definitions** → **Custom Alerts**
   - Create alerts for:
     - Drop in `playbook_email_sent` events
     - Spike in `rent_form_submit` but drop in `playbook_generated` (potential API issues)

2. **Create an Audience**:
   - Go to **Admin** → **Audiences**
   - Create audience: "Rent Tool Users"
   - Condition: Event `rent_tool_page_view` in last 30 days
   - Use this audience for remarketing or analysis

3. **Set Conversion Events**:
   - Go to **Admin** → **Events** → **Mark as conversion**
   - Mark `playbook_email_sent` as a conversion event
   - This will appear in your conversion reports

4. **Regular Review Schedule**:
   - Weekly: Check funnel conversion rates
   - Monthly: Review segment performance
   - Quarterly: Analyze trends and optimize

---

## 🆘 Troubleshooting

**Events not showing up?**
- Wait 24-48 hours for non-realtime data
- Check that `NEXT_PUBLIC_GA_ID` is set correctly in Vercel
- Use Realtime view to verify events are firing
- Enable `NEXT_PUBLIC_DEBUG_ANALYTICS=true` locally to see console logs

**Funnel showing 0% conversion?**
- Check date range (may be too short)
- Verify all event names match exactly (case-sensitive)
- Ensure events are firing in correct order

**Want to export data?**
- Click the **Share** button in any exploration
- Select **Download file** → Choose format (CSV, PDF, etc.)

---

## 📚 Additional Resources

- [GA4 Funnel Exploration Guide](https://support.google.com/analytics/answer/9327974)
- [GA4 Custom Reports](https://support.google.com/analytics/answer/9327974)
- [GA4 Event Tracking Best Practices](https://support.google.com/analytics/answer/9267735)
