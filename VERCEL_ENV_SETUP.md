# Vercel Environment Variables Setup

This guide explains how to add environment variables in Vercel for the rent tool GA4 tracking.

## Required Environment Variables

### `NEXT_PUBLIC_GA_ID`
- **What it is**: Your Google Analytics 4 Measurement ID
- **Format**: `G-XXXXXXXXXX`
- **Where to get it**: Google Analytics → Admin → Data Streams → Your Web Stream → Measurement ID
- **Why needed**: Enables GA4 tracking on your site

### Optional: `NEXT_PUBLIC_DEBUG_ANALYTICS`
- **What it is**: Debug flag for GA4 tracking
- **Values**: `true` or `false` (or leave unset)
- **Why needed**: Logs all GA4 events to browser console for debugging
- **When to use**: Only enable this when testing/debugging

## How to Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Log into [Vercel](https://vercel.com)
2. Select your project (December-WeLeap-Website)

### Step 2: Navigate to Settings
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar

### Step 3: Add Variables
1. Click **Add New** button
2. For each variable:
   - **Key**: `NEXT_PUBLIC_GA_ID`
   - **Value**: Your GA4 Measurement ID (e.g., `G-ABC123XYZ`)
   - **Environments**: Select all (Production, Preview, Development) or just Production
   - Click **Save**

3. (Optional) Add debug flag:
   - **Key**: `NEXT_PUBLIC_DEBUG_ANALYTICS`
   - **Value**: `true` (or `false` to disable)
   - **Environments**: Development/Preview (don't enable in Production)
   - Click **Save**

### Step 4: Redeploy
After adding variables, you need to redeploy:
1. Go to **Deployments** tab
2. Click the **...** (three dots) on your latest deployment
3. Click **Redeploy**
4. Or make a new commit/push to trigger automatic redeploy

## Important Notes

### About `NEXT_PUBLIC_` Prefix
- **No special enabling needed** - Next.js automatically exposes variables starting with `NEXT_PUBLIC_` to the browser
- Any variable without this prefix is server-only and won't be accessible in client-side code
- This is a Next.js feature, not a Vercel feature

### Security
- Variables with `NEXT_PUBLIC_` are exposed to the browser - **never put secrets here**
- `NEXT_PUBLIC_GA_ID` is safe to expose (it's meant to be public)
- `NEXT_PUBLIC_DEBUG_ANALYTICS` is also safe to expose

### After Adding Variables
- **Redeploy required**: Changes to environment variables require a new deployment
- **All environments**: Consider if you want the variable in Production, Preview, and Development
- **Check deployment logs**: After redeploy, check that variables are loading correctly

## Verification

After redeploying, verify it's working:

1. **Check in browser**:
   - Open your deployed site
   - Open DevTools → Console
   - Type: `window.gtag` - should not be `undefined`
   
2. **Check debug logs** (if enabled):
   - Open DevTools → Console
   - Interact with the rent tool
   - Should see: `[Analytics] rent_tool_page_view ...`

3. **Check GA4 Realtime**:
   - Go to Google Analytics → Reports → Realtime
   - Interact with your site
   - Should see events appearing within 30-60 seconds

## Troubleshooting

### Events not showing in GA4
- ✅ Verify `NEXT_PUBLIC_GA_ID` is set correctly in Vercel
- ✅ Verify you redeployed after adding the variable
- ✅ Check browser console for errors
- ✅ Verify cookie consent is accepted (if using consent banner)
- ✅ Wait 30-60 seconds for Realtime data

### Variable not found in code
- ✅ Ensure variable name starts with `NEXT_PUBLIC_`
- ✅ Redeploy after adding/changing variable
- ✅ Check that environment is correct (Production vs Preview vs Development)
