# Deployment Setup Guide

This guide will help you configure environment variables for your deployed website.

## Environment Variables Required

You need to set the following environment variables in your deployment platform:

### 1. Google Sheets Integration
```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 2. Google Analytics (Optional)
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Substack Newsletter Integration (Optional)
```
SUBSTACK_PUBLICATION_URL=https://yourpublication.substack.com
```
**Note**: Replace `yourpublication` with your actual Substack publication name. If not set, subscriptions will be logged to Google Sheets (if configured) but won't redirect to Substack.

## Setting Up Environment Variables

### For Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **Settings** (in the top navigation)
4. Click on **Environment Variables** (in the left sidebar)
5. Add each variable:
   - **Name**: `GOOGLE_SCRIPT_URL`
   - **Value**: Your Google Apps Script Web App URL
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
6. Repeat for `NEXT_PUBLIC_GA_ID` if using Google Analytics
7. Repeat for `SUBSTACK_PUBLICATION_URL` if using Substack newsletter
8. **Important**: After adding variables, you need to **redeploy** your site:
   - Go to **Deployments** tab
   - Click the **three dots (⋯)** on the latest deployment
   - Click **Redeploy**

### For Netlify

1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add each variable:
   - **Key**: `GOOGLE_SCRIPT_URL`
   - **Value**: Your Google Apps Script Web App URL
   - **Scopes**: Select all (Production, Deploy previews, Branch deploys)
   - Click **Save**
6. Repeat for `NEXT_PUBLIC_GA_ID` if using Google Analytics
7. Repeat for `SUBSTACK_PUBLICATION_URL` if using Substack newsletter
8. **Important**: After adding variables, trigger a new deployment:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### For Other Platforms

The process is similar:
1. Find the **Environment Variables** or **Config Vars** section in your platform's settings
2. Add `GOOGLE_SCRIPT_URL` with your Google Apps Script URL
3. Add `NEXT_PUBLIC_GA_ID` if using Google Analytics
4. Redeploy your site after adding variables

## Verifying the Setup

After redeploying:

1. **Check Configuration (Diagnostic Endpoint)**:
   - Visit: `https://your-domain.com/api/waitlist/check`
   - This will show if environment variables are configured
   - Should return: `{"configured":{"googleSheets":true,"googleAnalytics":true},...}`
   - If `googleSheets: false`, the `GOOGLE_SCRIPT_URL` is not set

2. **Test the waitlist form**:
   - Go to your deployed website
   - Click "Join Waitlist"
   - Enter an email and submit
   - Check your Google Sheet - you should see a new row

3. **Check deployment logs**:
   - Look for any errors in your deployment platform's logs
   - The API route should log messages like "[Waitlist API] Sending to Google Sheets" if working correctly
   - Look for "[Waitlist API] Google Sheets not configured" if the environment variable is missing

4. **Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try submitting the form
   - Check for any error messages

## Troubleshooting

### Waitlist form shows error or doesn't work

**Step 1: Check if environment variable is set**
- Visit: `https://your-domain.com/api/waitlist/check`
- If `googleSheets: false`, the environment variable is not set
- **Solution**: Add `GOOGLE_SCRIPT_URL` in your deployment platform and redeploy

**Step 2: Verify environment variable**
- **Check**: Is `GOOGLE_SCRIPT_URL` set in your deployment platform?
- **Check**: Did you redeploy after adding the environment variable?
- **Check**: Is the variable name exactly `GOOGLE_SCRIPT_URL` (case-sensitive)?
- **Check**: Is the URL complete and correct?

**Step 3: Check Google Apps Script**
- **Check**: Is your Google Apps Script deployed and accessible?
- **Check**: Is the Web App set to "Anyone" access?
- **Check**: Google Apps Script execution logs for errors

### Data not appearing in Google Sheet
- **Check**: Google Apps Script execution logs (Extensions → Apps Script → View → Execution log)
- **Check**: Is the Web App deployed with "Anyone" access?
- **Check**: Are the column headers correct in your Google Sheet?

### API route returns 500 error
- **Check**: Deployment logs for server-side errors
- **Check**: Environment variables are correctly named (case-sensitive)
- **Check**: No typos in the Google Script URL

## Testing Locally vs Production

- **Local**: Uses `.env.local` file
- **Production**: Uses environment variables set in your deployment platform
- **Important**: Environment variables must be set separately in each environment

## Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Environment variables in deployment platforms are encrypted
- `GOOGLE_SCRIPT_URL` is server-side only (not exposed to client)
- `NEXT_PUBLIC_GA_ID` is client-side (prefixed with `NEXT_PUBLIC_`)
