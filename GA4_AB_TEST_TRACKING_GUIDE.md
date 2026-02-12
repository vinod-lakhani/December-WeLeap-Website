# How to Track Variant A vs Variant B in GA4

> **DEPRECATED:** The Day-0 Cash A/B test has been removed. The rent tool now always shows the upfront cash number immediately (no email gate). This guide is kept for historical reference only.

---

## 🎯 Key Events to Monitor

### 1. **Core Funnel Events** (All include `ab_day0_cash_variant` parameter)

These events fire for both variants and include the variant parameter:

- `rent_tool_page_view_v2` - Page loads
- `scrolled_past_how_it_works_v2` - User scrolled past "How it works"
- `hero_cta_click_v2` - User clicked "See my rent reality"
- `rent_form_start_v2` - User started filling form
- `rent_form_submit_v2` - User submitted form
- `playbook_generated_v2` - Playbook was generated
- `playbook_email_sent_v2` - Email was sent (from WaitlistForm - Variant A only)

### 2. **Day-0 Cash Specific Events** (The key differentiators)

These events are unique to the Day-0 Cash module:

- `day0_cash_module_view` - Day-0 Cash module became visible
- `day0_cash_cta_click` - User clicked CTA in Day-0 module
  - Variant A: "View assumptions" (opens accordion)
  - Variant B: "Get my Day-0 Cash Plan" (opens email modal)
- `day0_cash_email_modal_open` - Email modal opened (mostly Variant B)
- `day0_cash_email_submit` - Email submitted via Day-0 modal (Variant B only)
- `day0_cash_number_revealed` - Exact number was shown
  - Variant A: Fires immediately when module is visible
  - Variant B: Fires only after email submit

---

## 📊 Method 1: Events Report with Breakdown

### Quick Comparison View

1. Go to **Reports** → **Engagement** → **Events**
2. Find the event you want to compare (e.g., `day0_cash_email_submit`)
3. Click on the event name
4. Scroll down to **Event parameters**
5. Look for `ab_day0_cash_variant` parameter
6. You'll see counts for `A` and `B`

**What to compare:**
- `day0_cash_email_submit` - Higher in Variant B (expected)
- `day0_cash_number_revealed` - Should be similar (both variants show number eventually)
- `playbook_email_sent_v2` - Should be higher in Variant A (they have WaitlistForm)

---

## 📊 Method 2: Funnel Exploration (Recommended)

### Create A/B Test Funnel

1. Go to **Explore** → **Funnel exploration**
2. Click **+ Blank** or use template
3. Name it: **"Day-0 Cash A/B Test Funnel"**

### Configure Funnel Steps

#### Step 1: Page View (All Users)
- **Step name**: `Page Loaded`
- **Dimension**: `Event name`
- **Condition**: `exactly matches`
- **Value**: `rent_tool_page_view_v2`
- Click **+ Add step**

#### Step 2: Day-0 Module Viewed
- **Step name**: `Saw Day-0 Module`
- **Dimension**: `Event name`
- **Condition**: `exactly matches`
- **Value**: `day0_cash_module_view`
- Click **+ Add step**

#### Step 3: CTA Clicked
- **Step name**: `Clicked CTA`
- **Dimension**: `Event name`
- **Condition**: `exactly matches`
- **Value**: `day0_cash_cta_click`
- Click **+ Add step**

#### Step 4: Email Submitted (Variant B)
- **Step name**: `Email Submitted (Day-0)`
- **Dimension**: `Event name`
- **Condition**: `exactly matches`
- **Value**: `day0_cash_email_submit`
- Click **+ Add step**

#### Step 5: Number Revealed
- **Step name**: `Number Revealed`
- **Dimension**: `Event name`
- **Condition**: `exactly matches`
- **Value**: `day0_cash_number_revealed`
- Click **+ Add step**

### Add Variant Breakdown

1. In the **Breakdown** section (right sidebar), click **+ Add dimension**
2. Search for `ab_day0_cash_variant`
3. If it doesn't appear, you need to register it as a Custom Dimension first
   - See `GA4_CUSTOM_DIMENSIONS_SETUP.md` for instructions
4. Select it
5. You'll now see separate funnels for Variant A and Variant B

### Key Metrics to Compare

**Conversion Rates:**
- Step 1 → Step 2: % who saw Day-0 module (should be ~100% for both)
- Step 2 → Step 3: % who clicked CTA (compare engagement)
- Step 3 → Step 4: % who submitted email (Variant B should be higher)
- Step 4 → Step 5: % who saw number (should be ~100% for Variant B)

**Drop-off Points:**
- Where do Variant A users drop off?
- Where do Variant B users drop off?
- Is Variant B's email gate causing drop-off?

---

## 📊 Method 3: Custom Report with Comparisons

### Create Custom Report

1. Go to **Explore** → **Free form**
2. Name it: **"A/B Test Comparison"**

### Configure Dimensions & Metrics

**Dimensions:**
- `Event name`
- `ab_day0_cash_variant` (register as Custom Dimension first)

**Metrics:**
- `Event count`
- `Total users`
- `Event count per user`

### Add Filters

1. Click **+ Add filter**
2. **Dimension**: `Event name`
3. **Condition**: `contains`
4. **Value**: `day0_cash` (to see all Day-0 events)

### Pivot Table View

1. Drag `Event name` to **Rows**
2. Drag `ab_day0_cash_variant` to **Columns**
3. Drag `Total users` to **Values**
4. You'll see a table comparing Variant A vs B for each event

---

## 🎯 Key Metrics to Track

### Primary Conversion Metric

**Email Capture Rate:**
- Variant A: `playbook_email_sent_v2` (from WaitlistForm)
- Variant B: `day0_cash_email_submit` (from Day-0 modal)
- **Question**: Does Variant B capture more emails?

### Engagement Metrics

1. **Day-0 Module Engagement:**
   - `day0_cash_module_view` → `day0_cash_cta_click` conversion rate
   - Compare: Which variant has higher CTA click rate?

2. **Number Reveal Rate:**
   - `day0_cash_number_revealed` / `day0_cash_module_view`
   - Variant A: Should be ~100% (immediate)
   - Variant B: Should be lower (gated behind email)

3. **Overall Email Capture:**
   - Variant A: `playbook_email_sent_v2` count
   - Variant B: `day0_cash_email_submit` + `playbook_email_sent_v2` (if they also use WaitlistForm)
   - **Question**: Does Variant B increase total email captures?

---

## 📈 Expected Results

### Variant A (Control)
- ✅ `day0_cash_number_revealed` fires immediately (100% of module views)
- ✅ `day0_cash_cta_click` with label "View assumptions"
- ✅ `playbook_email_sent_v2` from WaitlistForm (bottom card)
- ❌ `day0_cash_email_submit` should be 0 or very low

### Variant B (Test)
- ✅ `day0_cash_email_modal_open` fires when CTA clicked
- ✅ `day0_cash_email_submit` fires when email submitted
- ✅ `day0_cash_number_revealed` fires only after email submit
- ✅ `day0_cash_cta_click` with label "Get my Day-0 Cash Plan"
- ❌ `playbook_email_sent_v2` should be 0 (WaitlistForm hidden)

---

## 🔍 How to Register `ab_day0_cash_variant` as Custom Dimension

If the variant parameter doesn't appear in GA4 dropdowns:

1. Go to **Admin** → **Custom definitions** → **Custom dimensions**
2. Click **+ Create custom dimension**
3. **Dimension name**: `A/B Test Variant`
4. **Scope**: `Event`
5. **Event parameter**: `ab_day0_cash_variant`
6. **Description**: "Day-0 Cash Reality A/B test variant (A or B)"
7. Click **Save**
8. Wait 24-48 hours for data to populate

See `GA4_CUSTOM_DIMENSIONS_SETUP.md` for detailed instructions.

---

## 🧪 Testing Your Setup

### Verify Events are Firing

1. Set `NEXT_PUBLIC_DEBUG_ANALYTICS=true` in `.env.local`
2. Open browser console
3. Visit:
   - Variant A: `http://localhost:3000/how-much-rent-can-i-afford?ab_day0=A`
   - Variant B: `http://localhost:3000/how-much-rent-can-i-afford?ab_day0=B`
4. Check console for `[Analytics]` logs
5. Verify `ab_day0_cash_variant` parameter is included

### Check Realtime View

1. Go to **Reports** → **Realtime**
2. Scroll to **Event count by Event name**
3. Look for `day0_cash_` events
4. Click on an event to see parameters
5. Verify `ab_day0_cash_variant` shows `A` or `B`

---

## 📋 Quick Reference: Event Checklist

Use this checklist to verify all events are firing:

### Variant A Events
- [ ] `rent_tool_page_view_v2` with `ab_day0_cash_variant: A`
- [ ] `day0_cash_module_view` with `ab_day0_cash_variant: A`
- [ ] `day0_cash_number_revealed` with `ab_day0_cash_variant: A` (immediate)
- [ ] `day0_cash_cta_click` with `cta_label: "View assumptions"`
- [ ] `playbook_email_sent_v2` with `ab_day0_cash_variant: A` (from WaitlistForm)

### Variant B Events
- [ ] `rent_tool_page_view_v2` with `ab_day0_cash_variant: B`
- [ ] `day0_cash_module_view` with `ab_day0_cash_variant: B`
- [ ] `day0_cash_cta_click` with `cta_label: "Get my Day-0 Cash Plan"`
- [ ] `day0_cash_email_modal_open` with `ab_day0_cash_variant: B`
- [ ] `day0_cash_email_submit` with `ab_day0_cash_variant: B`
- [ ] `day0_cash_number_revealed` with `ab_day0_cash_variant: B` (after email)
- [ ] `playbook_email_sent_v2` with `ab_day0_cash_variant: B` (should be 0 or low)

---

## 💡 Pro Tips

1. **Wait 24-48 hours** for events to appear in standard reports (Realtime works immediately)

2. **Use Realtime view** for quick verification during testing

3. **Create saved reports** so you can quickly check A/B test performance

4. **Set up alerts** in GA4 to notify you when conversion rates change significantly

5. **Compare date ranges** - Look at Variant A vs B for the same time period

6. **Check statistical significance** - Use GA4's built-in significance testing or export to Excel/Google Sheets for deeper analysis

---

## 📞 Need Help?

- See `GA4_AB_TEST_EVENTS.md` for full event documentation
- See `GA4_CUSTOM_DIMENSIONS_SETUP.md` for dimension setup
- See `GA4_CUSTOM_REPORTS.md` for funnel setup
- Check browser console with `NEXT_PUBLIC_DEBUG_ANALYTICS=true` for event debugging
