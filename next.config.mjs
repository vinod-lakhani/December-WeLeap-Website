import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
 
  eslint: {
    ignoreDuringBuilds: false,
  },

  async redirects() {
    return [
      {
        // /product-features was the 5th most-visited page (~260 visitors) but
        // its content was badly out of date. Permanent redirect rather than a
        // delete so the traffic and any inbound links land on the current
        // "how it works" content instead of a 404.
        source: '/product-features',
        destination: '/#how-it-works',
        permanent: true,
      },
      {
        // Short alias for the share card and social bios. People retype these
        // from a screenshot, so the long path is unusable there.
        source: '/rent',
        destination: '/how-much-rent-can-i-afford',
        permanent: false,
      },
    ]
  },


  // Ensure PDFKit's data files are included in serverless builds
  serverExternalPackages: ['pdfkit'],
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Fix for @react-pdf/renderer in Next.js
      config.externals = [...(config.externals || []), 'canvas', 'fs'];
      
      // Copy PDFKit font files to server build output (needed for both dev and production)
      // Copy to multiple locations to handle different paths PDFKit might check
      // Only apply to server-side builds to avoid interfering with client chunks
      try {
        if (CopyWebpackPlugin) {
          config.plugins.push(
            new CopyWebpackPlugin({
              patterns: [
                {
                  from: path.join(__dirname, 'node_modules/pdfkit/js/data'),
                  to: path.join(__dirname, '.next/server/vendor-chunks/data'),
                  noErrorOnMissing: true,
                  globOptions: {
                    ignore: ['**/.DS_Store'],
                  },
                },
                {
                  from: path.join(__dirname, 'node_modules/pdfkit/js/data'),
                  to: path.join(__dirname, '.next/server/app/api/email-plan/data'),
                  noErrorOnMissing: true,
                  globOptions: {
                    ignore: ['**/.DS_Store'],
                  },
                },
                {
                  from: path.join(__dirname, 'node_modules/pdfkit/js/data'),
                  to: path.join(__dirname, '.next/server/data'),
                  noErrorOnMissing: true,
                  globOptions: {
                    ignore: ['**/.DS_Store'],
                  },
                },
              ],
            })
          );
        }
      } catch (pluginError) {
        console.warn('[Next Config] CopyWebpackPlugin error (non-critical):', pluginError);
        // Continue without the plugin - PDFKit should work with built-in fonts
      }
    }
    return config;
  },
}

export default nextConfig