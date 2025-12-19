# Google Analytics Setup

This guide will help you set up Google Analytics for your WeLeap website.

## Step 1: Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon) in the bottom left
4. In the **Property** column, click **Create Property**
5. Fill in the property details:
   - **Property name**: "WeLeap Website" (or your preferred name)
   - **Reporting time zone**: Select your timezone
   - **Currency**: Select your currency
6. Click **Next**
7. Fill in business information and click **Create**
8. Accept the terms of service

## Step 2: Get Your Measurement ID

1. After creating the property, you'll see a **Data Streams** section
2. Click **Web** to add a web stream
3. Enter your website URL (e.g., `https://yourdomain.com`)
4. Enter a stream name (e.g., "WeLeap Website")
5. Click **Create stream**
6. You'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
7. **Copy this Measurement ID** - you'll need it for the next step

## Step 3: Add Measurement ID to Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following line:

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

3. Save the file
4. **Restart your Next.js development server** for the changes to take effect

## Step 4: Verify It's Working

1. Start your Next.js app: `npm run dev`
2. Visit your website in a browser
3. Open Google Analytics → **Reports** → **Realtime**
4. You should see your visit appear in the realtime report within a few seconds

## What Gets Tracked

Google Analytics will automatically track:
- **Page views**: Every page visit
- **User sessions**: How users navigate your site
- **Traffic sources**: Where visitors come from
- **Device information**: Desktop, mobile, tablet
- **Geographic data**: Where visitors are located
- **User engagement**: Time on page, bounce rate, etc.

## Optional: Enhanced Tracking

You can add custom event tracking for specific actions. For example, to track waitlist signups:

```tsx
import { sendGAEvent } from '@next/third-parties/google'

// In your component
sendGAEvent('event', 'waitlist_signup', {
  signup_type: 'hero',
  page: '/'
})
```

## Troubleshooting

### Analytics not showing data
- Make sure `NEXT_PUBLIC_GA_ID` is set in `.env.local`
- Restart your dev server after adding the environment variable
- Check that the Measurement ID format is correct (starts with `G-`)
- Wait a few minutes - realtime data can take 30-60 seconds to appear

### Build errors
- Make sure `@next/third-parties` is installed (it should be in your package.json)
- Check that the environment variable is prefixed with `NEXT_PUBLIC_` (required for client-side access)

### Privacy considerations
- Consider adding a cookie consent banner for GDPR compliance
- Review Google Analytics data retention settings
- Configure IP anonymization if needed
