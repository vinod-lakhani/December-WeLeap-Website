import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * The share card's OG image renders per request, because the claim it draws
   * is a dynamic path segment — unlike the eight tool cards, which prerender
   * at build time in the project root.
   *
   * lib/og.tsx reads the two font files off disk with process.cwd(). That is
   * fine at build time and wrong in a serverless bundle, where nothing has
   * pulled the .ttf files in: the read succeeds locally and throws in
   * production. Tracing them explicitly is the documented fix, and it is
   * scoped to the one route that needs it rather than applied globally.
   */
  outputFileTracingIncludes: {
    '/s/[tool]/[claim]': ['./lib/fonts/**'],
  },
  typescript: {
    // Was true, which meant the build could not catch a regression — and had
    // been hiding real bugs: an undeclared variable that threw at runtime in
    // /api/subscribe, and a destructure of a non-existent field that made the
    // "401(k) is maxed" branch unreachable in the Money Plan. The project now
    // typechecks clean, so the build guards it.
    ignoreBuildErrors: false,
  },
  // `images: { unoptimized: true }` was removed here. It was a leftover — there
  // is no `output: 'export'`, so nothing needed it, and every image on the site
  // was a raw <img> anyway, which the flag does not touch. The components now
  // use next/image, so the Vercel optimizer resizes and re-encodes to
  // WebP/AVIF. No `images` block is needed: the defaults are what we want.

  eslint: {
    // ESLint now runs in the build. Zero errors, 77 warnings — and warnings do
    // not fail a build, so this catches new errors without holding deploys
    // hostage to the existing backlog.
    //
    // .eslintrc.json existed all along, extending next/core-web-vitals and
    // next/typescript — but ESLint itself was never installed, so it had never
    // run. Turning it on surfaced 312 react/no-unescaped-entities errors:
    // apostrophes in prose, with no runtime, accessibility or SEO consequence.
    // That rule is off. Escaping every apostrophe on the site to satisfy a rule
    // that predates React handling entities properly is churn, not quality.
    // Everything else is a warning, so the backlog stays visible and can be
    // burned down without blocking a deploy.
    ignoreDuringBuilds: false,
  },

  async redirects() {
    return [
      {
        // The pricing-philosophy article was removed, but the URL was in the
        // sitemap and is indexed, so a bare 404 would throw away whatever it
        // had accumulated. /pricing is the closest live equivalent — the
        // article was about why WeLeap charges what it does.
        //
        // Temporary rather than permanent on purpose: the article is archived
        // and may come back, and browsers cache 308s hard enough to make that
        // restoration messy.
        source: '/resources/pricing-philosophy',
        destination: '/pricing',
        permanent: false,
      },
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
        permanent: true,
      },
      {
        // Aimed at social, where the URL gets read off a screenshot.
        //
        // Points at the final destination rather than at /smart-purchase-check,
        // which is itself a 308 now: a redirect to a redirect costs a round
        // trip and dilutes the signal the 308 exists to pass. Same rule as
        // /leap-impact-simulator below.
        source: '/pay-now-or-later',
        destination: '/should-i-use-buy-now-pay-later',
        permanent: true,
      },
      {
        // The purchase tool was at /smart-purchase-check — the internal product
        // name for the decision engine, which reads as a feature label rather
        // than as anything a person types into a search box. Same reasoning as
        // /offer and /allocator: the slug is the strongest on-page signal on a
        // site whose tools sit at flat top-level routes, so it now says the
        // query the page targets.
        //
        // No short-alias exception like /rent and /offer keep: this tool has no
        // share card, so nothing prints the old path anywhere it gets retyped.
        source: '/smart-purchase-check',
        destination: '/should-i-use-buy-now-pay-later',
        permanent: true,
      },
      {
        // The compounding tool was at /net-worth-impact — the internal name for
        // the projection, which is a phrase nobody types and which describes the
        // output rather than the question. Same reasoning as /offer, /allocator
        // and /smart-purchase-check: on a site whose tools sit at flat top-level
        // routes, the slug is the strongest on-page signal, so it now says the
        // query the page targets.
        //
        // The new slug deliberately carries no dollar figure. $150 is today's
        // default, not the tool's subject, and a URL naming it would need
        // another 308 the first time that default changed.
        source: '/net-worth-impact',
        destination: '/what-is-saving-monthly-worth',
        permanent: true,
      },
      {
        // The emergency fund tool was at /emergency-fund-target — half product
        // language, in that "emergency fund" is what people type and "target"
        // is ours, and the pair is searched by nobody. Same reasoning as the
        // four renames around it: on a site whose tools sit at flat top-level
        // routes, the slug is the strongest on-page signal, so it now says the
        // query the page targets. The h1 had been asking that exact question
        // since the page was rebuilt; only the URL was still behind.
        //
        // No short-alias exception like /rent and /offer keep: this tool has no
        // share card, so nothing prints the old path anywhere it gets retyped.
        source: '/emergency-fund-target',
        destination: '/how-much-emergency-fund-do-i-need',
        permanent: true,
      },
      {
        // The offer tool was at /offer, a bare noun that matches nothing
        // anyone types and reads as "discount" rather than "job offer". The
        // slug is the strongest on-page signal on a site whose tools sit at
        // flat top-level routes, so it now says the query.
        //
        // /offer keeps working as the short alias — it is what the share card
        // prints, because people photograph that card and retype it, and
        // /what-is-my-job-offer-worth is not retypeable. Same role as /rent
        // above.
        source: '/offer',
        destination: '/what-is-my-job-offer-worth',
        permanent: true,
      },
      {
        // The money plan tool was at /allocator — the internal name for the
        // allocation engine, which matches nothing anyone types and reads as
        // jargon to a visitor. Same reasoning as /offer above: on a site whose
        // tools sit at flat top-level routes, the slug is the strongest
        // on-page signal, so it now says the query the page targets.
        //
        // No short-alias exception here, unlike /rent and /offer: nothing
        // prints /allocator on a share card, so it has no retypeable job to
        // keep doing.
        source: '/allocator',
        destination: '/how-should-i-split-my-paycheck',
        permanent: true,
      },
      {
        // The Leap Impact Simulator was the 401(k) wedge in front of the
        // allocation engine, which now collects those inputs itself. Permanent
        // so search consolidates onto one URL rather than splitting ranking
        // across two for one tool.
        //
        // Points at the final destination, not at /allocator: that would be a
        // redirect to a redirect, which costs a round trip and dilutes the
        // signal the 308 exists to pass. Whenever the destination below moves
        // again, this line moves with it rather than being left to chain.
        //
        // Note if this ever needs undoing: 308s are cached hard by browsers,
        // so anyone who has hit this path will keep being redirected until
        // their cache clears, regardless of what the server says.
        source: '/leap-impact-simulator',
        destination: '/how-should-i-split-my-paycheck',
        permanent: true,
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