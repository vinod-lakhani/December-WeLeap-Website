# GA4 Custom Dimensions Setup Guide

## The Problem

The parameters `salary_bucket`, `city_tier`, `rent_ratio_bucket`, and `days_until_start_bucket` are being sent with your events, but they won't appear in GA4 dropdowns until you register them as **Custom Dimensions**.

**Event parameters ≠ Custom dimensions automatically** - you need to register them first!

---

## Step-by-Step: Register Custom Dimensions

### Step 1: Access Custom Dimensions

1. Log into [Google Analytics](https://analytics.google.com)
2. Select **WeLeap** account → **Concierge Program** property
3. Click **Admin** (gear icon) in the bottom left
4. In the **Property** column, click **Custom Definitions**
5. Click **Custom Dimensions**

### Step 2: Create Each Custom Dimension

Click **Create custom dimension** for each one below. You'll need to create **4 custom dimensions** total.

---

#### Custom Dimension 1: Salary Bucket

1. **Dimension name**: `Salary Bucket`
2. **Scope**: Select **Event** (since it's sent with events)
3. **Event parameter**: Type `salary_bucket` (must match exactly - lowercase with underscore)
4. **Description** (optional): `Salary range buckets: <60k, 60_80k, 80_100k, 100_150k, 150k_plus`
5. Click **Save**

**Important**: The event parameter name must match exactly: `salary_bucket` (lowercase, with underscore)

---

#### Custom Dimension 2: City Tier

1. **Dimension name**: `City Tier`
2. **Scope**: Select **Event**
3. **Event parameter**: Type `city_tier` (must match exactly)
4. **Description** (optional): `City tier classification: tier_1, tier_2, other, unknown`
5. Click **Save**

**Event parameter name**: `city_tier`

---

#### Custom Dimension 3: Rent Ratio Bucket

1. **Dimension name**: `Rent Ratio Bucket`
2. **Scope**: Select **Event**
3. **Event parameter**: Type `rent_ratio_bucket` (must match exactly)
4. **Description** (optional): `Rent-to-income ratio buckets: <25, 25_35, 35_45, 45_plus, unknown`
5. Click **Save**

**Event parameter name**: `rent_ratio_bucket`

---

#### Custom Dimension 4: Days Until Start Bucket

1. **Dimension name**: `Days Until Start Bucket`
2. **Scope**: Select **Event**
3. **Event parameter**: Type `days_until_start_bucket` (must match exactly)
4. **Description** (optional): `Days until job start buckets: <14, 14_30, 30_60, 60_plus, unknown`
5. Click **Save**

**Event parameter name**: `days_until_start_bucket`

---

## Step 3: Wait for Processing

After creating custom dimensions:
- ⏱️ **Wait 24-48 hours** for GA4 to process historical data
- 🆕 **New events** will be indexed immediately (after creation)
- 📊 **Historical data** may take up to 48 hours to appear

---

## Step 4: Verify They're Working

### Option A: Check in Events Report

1. Go to **Reports** → **Engagement** → **Events**
2. Click on an event that has these parameters (e.g., `playbook_generated`, `rent_form_submit`)
3. Scroll down to **Event parameters**
4. You should see your custom dimensions listed there

### Option B: Use in Exploration

1. Go to **Explore** → Create a new **Free form** exploration
2. In the **Dimensions** panel, search for:
   - `Salary Bucket`
   - `City Tier`
   - `Rent Ratio Bucket`
   - `Days Until Start Bucket`
3. If they appear in the dropdown, they're working! ✅

### Option C: Check Custom Definitions List

1. Go to **Admin** → **Custom Definitions** → **Custom Dimensions**
2. You should see all 4 dimensions listed
3. Status should show as "Active" or "Collecting data"

---

## How to Use in Reports

Once registered, you can use these dimensions in:

### 1. Funnel Explorations
- **Breakdown dimension**: Select any of the custom dimensions
- See conversion rates by salary range, city tier, etc.

### 2. Free Form Explorations
- **Rows**: Drag `Salary Bucket` or `City Tier` to segment users
- **Columns**: Use for cross-tabulation analysis
- **Filters**: Filter by specific buckets (e.g., only `tier_1` cities)

### 3. Standard Reports
- Add as secondary dimensions
- Create custom reports with these dimensions

---

## Quick Reference: Event Parameter Names

Make sure the event parameter names match exactly when creating dimensions:

| Custom Dimension Name | Event Parameter Name | Example Values |
|----------------------|---------------------|----------------|
| `Salary Bucket` | `salary_bucket` | `<60k`, `60_80k`, `80_100k`, `100_150k`, `150k_plus` |
| `City Tier` | `city_tier` | `tier_1`, `tier_2`, `other`, `unknown` |
| `Rent Ratio Bucket` | `rent_ratio_bucket` | `<25`, `25_35`, `35_45`, `45_plus`, `unknown` |
| `Days Until Start Bucket` | `days_until_start_bucket` | `<14`, `14_30`, `30_60`, `60_plus`, `unknown` |

**Critical**: The event parameter name must be typed exactly as shown above (lowercase, with underscores).

---

## Troubleshooting

### Dimension doesn't appear after 48 hours
- ✅ Verify event parameter name matches exactly (case-sensitive!)
- ✅ Check that events with these parameters have fired (check Realtime)
- ✅ Verify the dimension scope is set to **Event** (not User or Session)
- ✅ Check Admin → Custom Definitions → Custom Dimensions to see if dimension exists

### "No data available" after creating dimension
- ⏱️ **Normal**: Historical data takes 24-48 hours to process
- ✅ **Test**: Fire new events and check if they appear (should work immediately for new events)
- ✅ **Verify**: Make sure events are actually sending these parameters (check browser console with debug mode)

### Dimension appears but has no values
- ✅ Check Realtime view - do you see events firing with these parameters?
- ✅ Verify the parameter names in your code match exactly
- ✅ Check browser console with `NEXT_PUBLIC_DEBUG_ANALYTICS=true` to see what's being sent

### Can't find dimension in dropdown
- ✅ Wait 24-48 hours after creation
- ✅ Check that you're looking in the right place (Dimensions panel in Explorations)
- ✅ Verify the dimension status shows "Active" in Admin → Custom Definitions

---

## Important Notes

### GA4 Limits
- **50 custom dimensions** per property (you're using 4, so plenty of room)
- **Scope matters**: Event-scoped dimensions only work with events (which is what we want)

### Best Practices
- ✅ Use descriptive dimension names (what we did: "Salary Bucket" not "salary_bucket")
- ✅ Keep event parameter names consistent in code
- ✅ Document your custom dimensions (you can add descriptions)

### Historical Data
- 📅 Events sent **before** creating the dimension: Will NOT be retroactively indexed
- 📅 Events sent **after** creating the dimension: Will be indexed with the dimension
- 🔄 If you need historical data, you'll need to wait for new events to fire

---

## Next Steps

After setting up custom dimensions:

1. ✅ Update your funnel exploration to use these dimensions as breakdowns
2. ✅ Create segment reports by salary bucket or city tier
3. ✅ Analyze conversion rates by user segment
4. ✅ Track trends over time by dimension

See `GA4_CUSTOM_REPORTS.md` for examples of how to use these dimensions in reports!

---

## Code Reference

These parameters are sent with these events:
- `rent_form_submit`
- `playbook_generated`
- `playbook_email_sent`

See `lib/buckets.ts` for how values are calculated and `components/OfferTool.tsx` for where they're sent.
