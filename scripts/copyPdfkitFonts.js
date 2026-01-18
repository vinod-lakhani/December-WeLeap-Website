const fs = require('fs');
const path = require('path');

/**
 * Copy PDFKit font files to the build output
 * This ensures fonts are available in serverless environments like Vercel
 */
function copyPdfkitFonts() {
  const srcDir = path.resolve(__dirname, '../node_modules/pdfkit/js/data');
  const destDir = path.resolve(__dirname, '../.next/server/vendor-chunks/data');

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('[Postbuild] Created directory:', destDir);
  }

  // Check if source directory exists
  if (!fs.existsSync(srcDir)) {
    console.warn('[Postbuild] PDFKit font directory not found:', srcDir);
    console.warn('[Postbuild] This is okay if PDFKit isn\'t installed yet');
    return;
  }

  try {
    // Read all files in the source directory
    const files = fs.readdirSync(srcDir);

    // Copy each .afm file (font metric files)
    let copiedCount = 0;
    files.forEach((file) => {
      if (file.endsWith('.afm')) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        
        try {
          fs.copyFileSync(srcFile, destFile);
          copiedCount++;
          console.log(`[Postbuild] Copied ${file} to build output`);
        } catch (copyError) {
          console.error(`[Postbuild] Failed to copy ${file}:`, copyError.message);
        }
      }
    });

    console.log(`[Postbuild] Copied ${copiedCount} PDFKit font file(s)`);
  } catch (error) {
    console.error('[Postbuild] Error copying PDFKit fonts:', error.message);
    // Don't throw - this is non-critical
  }
}

// Run the copy function
copyPdfkitFonts();
