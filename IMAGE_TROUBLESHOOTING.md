# Image Not Displaying on Vercel - Troubleshooting

If Shubha's image (`shubha.jpeg`) is not displaying on Vercel:

## Quick Fixes

1. **Trigger a New Deployment**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**
   - This ensures the image file is included in the build

2. **Clear Vercel Cache**:
   - In Vercel Dashboard → Settings → General
   - Look for cache clearing options
   - Or trigger a new deployment with "Clear Cache" option

3. **Verify the File is in the Repository**:
   - Check: `https://github.com/vinod-lakhani/December-WeLeap-Website/blob/main/public/images/shubha.jpeg`
   - The file should be visible in the repository

4. **Check File Path**:
   - The image path in code: `/images/shubha.jpeg`
   - This maps to: `public/images/shubha.jpeg` in the repository
   - Verify the file exists at this exact path

## Common Issues

### File Not Committed
- Make sure the file is committed: `git add public/images/shubha.jpeg`
- Make sure it's pushed: `git push origin main`

### Case Sensitivity
- Verify the filename is exactly `shubha.jpeg` (lowercase)
- The path in code must match exactly: `/images/shubha.jpeg`

### Vercel Build Cache
- Vercel may cache old builds
- Force a new deployment to clear cache

### File Size
- Very large images might cause issues
- Current size: ~28KB (should be fine)

## Verification Steps

1. Check if file exists in GitHub:
   ```
   https://github.com/vinod-lakhani/December-WeLeap-Website/blob/main/public/images/shubha.jpeg
   ```

2. Check Vercel build logs:
   - Look for any errors related to the image file
   - Verify the file is included in the build output

3. Test the image URL directly:
   - Visit: `https://your-domain.vercel.app/images/shubha.jpeg`
   - If this works, the issue is with the code reference
   - If this doesn't work, the file isn't being deployed

## Alternative Solutions

If the issue persists, try:
1. Rename the file to `shubha.jpg` (change extension)
2. Update the code to match: `src="/images/shubha.jpg"`
3. Commit and redeploy

Or convert to PNG format (like Vinod's image):
1. Convert `shubha.jpeg` to `shubha.png`
2. Update code: `src="/images/shubha.png"`
3. Commit and redeploy
