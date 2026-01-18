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
  
  // Ensure PDFKit's data files are included in serverless builds
  serverExternalPackages: ['pdfkit'],
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Fix for @react-pdf/renderer in Next.js
      config.externals = [...(config.externals || []), 'canvas', 'fs'];
      
      // Copy PDFKit font files to server build output (needed for both dev and production)
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