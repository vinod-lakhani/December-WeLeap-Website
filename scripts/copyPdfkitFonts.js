const fs = require('fs');
const path = require('path');

/**
 * Copy PDFKit font files to the build output
 * This ensures fonts are available in serverless environments like Vercel
 * Copies to multiple locations to handle different build paths
 */
function copyPdfkitFonts() {
  const srcDir = path.resolve(__dirname, '../node_modules/pdfkit/js/data');

  // Check if source directory exists
  if (!fs.existsSync(srcDir)) {
    console.warn('[Postbuild] PDFKit font directory not found:', srcDir);
    console.warn('[Postbuild] This is okay if PDFKit isn\'t installed yet');
    return;
  }

  // Multiple destination directories to cover different build paths
  const destDirs = [
    path.resolve(__dirname, '../.next/server/vendor-chunks/data'),
    path.resolve(__dirname, '../.next/server/app/api/email-plan/data'),
    path.resolve(__dirname, '../.next/server/data'),
  ];

  try {
    // Read all files in the source directory
    const files = fs.readdirSync(srcDir);

    let totalCopied = 0;

    // Copy to each destination directory
    destDirs.forEach((destDir) => {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log('[Postbuild] Created directory:', destDir);
      }

      // Copy each file (both .afm and .json files)
      files.forEach((file) => {
        if (file.endsWith('.afm') || file.endsWith('.json')) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          
          try {
            fs.copyFileSync(srcFile, destFile);
            totalCopied++;
            console.log(`[Postbuild] Copied ${file} to ${destDir}`);
          } catch (copyError) {
            console.error(`[Postbuild] Failed to copy ${file} to ${destDir}:`, copyError.message);
          }
        }
      });
    });

    console.log(`[Postbuild] Total: Copied ${totalCopied} PDFKit font file(s) to ${destDirs.length} location(s)`);
  } catch (error) {
    console.error('[Postbuild] Error copying PDFKit fonts:', error.message);
    // Don't throw - this is non-critical
  }
}

// Run the copy function
copyPdfkitFonts();
