# Google Sheets Integration Setup

This guide will help you set up Google Sheets to automatically record waitlist signups.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "WeLeap Waitlist Signups" (or any name you prefer)
4. In the first row, add these column headers:
   - **Email** (Column A)
   - **Signup Type** (Column B)
   - **Page** (Column C)
   - **Timestamp** (Column D)

## Step 2: Create Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy and paste the following code:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming data
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Handle form data if sent as parameters
      data = e.parameter;
    } else {
      throw new Error('No data received');
    }
    
    // Extract the fields
    const email = data.email || '';
    const signupType = data.signupType || '';
    const page = data.page || '';
    const timestamp = data.timestamp || new Date().toISOString();
    
    // Append the row to the sheet
    sheet.appendRow([email, signupType, page, timestamp]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾 icon) and name your project "WeLeap Waitlist Handler"

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "WeLeap Waitlist Handler v1"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (this allows your Next.js app to call it)
4. Click **Deploy**
5. **Copy the Web App URL** - you'll need this for the next step
6. Click **Done**

## Step 4: Add Environment Variable

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following line with your Web App URL:

```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace `YOUR_SCRIPT_ID` with the actual ID from your Web App URL.

3. Restart your Next.js development server for the changes to take effect

## Step 5: Test It

1. Start your Next.js app: `npm run dev`
2. Click a "Join Waitlist" button
3. Enter an email and submit
4. Check your Google Sheet - you should see a new row with the data!

## Troubleshooting

### Data not appearing in Google Sheet
- Make sure the Web App is deployed with "Anyone" access
- Check that the `.env.local` file has the correct `GOOGLE_SCRIPT_URL`
- Verify the column headers match exactly: Email, Signup Type, Page, Timestamp
- Check the Apps Script execution logs: **View** → **Execution log**

### CORS Errors
- Make sure the Web App deployment has "Anyone" access
- Try redeploying the script as a new version

### Permission Errors
- Make sure you clicked "Authorize access" when deploying
- Grant the necessary permissions when prompted

## Optional: Format the Sheet

You can format the header row:
1. Select row 1
2. Make it bold: **Format** → **Text** → **Bold**
3. Add background color: **Format** → **Fill color**
4. Freeze the header row: **View** → **Freeze** → **1 row**

## Security Note

The Web App URL will be public. To add security:
1. Add a secret token in your Apps Script
2. Send it in the request from your Next.js API
3. Verify it in the Apps Script before writing to the sheet

Example with token:
```javascript
const SECRET_TOKEN = 'your-secret-token-here';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Verify token
  if (data.token !== SECRET_TOKEN) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... rest of the code
}
```

Then add `token: process.env.GOOGLE_SCRIPT_TOKEN` to your API route.
