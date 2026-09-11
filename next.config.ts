import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

// The self-hosted OpenPanel instance serves both the tracker script and the
// endpoint it reports to, so one origin covers script-src and connect-src. It
// is a constant rather than a read of NEXT_PUBLIC_OPENPANEL_API_URL because
// production deploys the bundle the staging workflow built, so a build-time
// read would bake staging's configuration into the production policy. Merely
// allowing the origin tracks nobody; whether a tracker renders at all is
// decided per environment by NEXT_PUBLIC_OPENPANEL_CLIENT_ID at runtime. Keep
// this host and NEXT_PUBLIC_OPENPANEL_API_URL pointing at the same instance.
const analyticsOrigin = ' https://analytics.zias.be'

const scriptSource =
  process.env.NODE_ENV === 'development'
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com${analyticsOrigin}`
    : `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${analyticsOrigin}`

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; base-uri 'self'; connect-src 'self' https://challenges.cloudflare.com https://www.googleapis.com${analyticsOrigin}; font-src 'self' data:; form-action 'self'; frame-ancestors 'self'; frame-src 'self' https://challenges.cloudflare.com https://www.google.com; img-src 'self' blob: data: https:; object-src 'none'; ${scriptSource}; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests`,
          },
          // Severs the opener relationship for cross-origin windows, which is
          // what Lighthouse's origin-isolation audit asks for. `allow-popups`
          // rather than the stricter `same-origin` so that any window this or
          // the Payload admin opens keeps working; nothing here needs full
          // cross-origin isolation.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/:locale(nl|en)/registration/cancel/:token',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/:locale(nl|en)/preview/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ]
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // The locale-less root has one canonical destination; a permanent
      // redirect stops it from competing with /nl for search signals.
      { source: '/', destination: '/nl', permanent: true },
      { source: '/wie-we-zijn', destination: '/nl/over-ons#wie-we-zijn', permanent: true },
      { source: '/wat-we-doen', destination: '/nl/over-ons#wat-we-doen', permanent: true },
      { source: '/geschiedenis', destination: '/nl/over-ons#netwerk', permanent: true },
      { source: '/nl/wie-we-zijn', destination: '/nl/over-ons#wie-we-zijn', permanent: true },
      {
        source: '/nl/over-ons/wie-we-zijn',
        destination: '/nl/over-ons#wie-we-zijn',
        permanent: true,
      },
      { source: '/nl/wat-we-doen', destination: '/nl/over-ons#wat-we-doen', permanent: true },
      {
        source: '/nl/over-ons/wat-we-doen',
        destination: '/nl/over-ons#wat-we-doen',
        permanent: true,
      },
      { source: '/nl/geschiedenis', destination: '/nl/over-ons#netwerk', permanent: true },
      { source: '/nl/over-ons/geschiedenis', destination: '/nl/over-ons#netwerk', permanent: true },
      { source: '/en/who-we-are', destination: '/en/about-us#who-we-are', permanent: true },
      {
        source: '/en/about-us/who-we-are',
        destination: '/en/about-us#who-we-are',
        permanent: true,
      },
      { source: '/en/what-we-do', destination: '/en/about-us#what-we-do', permanent: true },
      {
        source: '/en/about-us/what-we-do',
        destination: '/en/about-us#what-we-do',
        permanent: true,
      },
      { source: '/en/history', destination: '/en/about-us#network', permanent: true },
      { source: '/en/about-us/history', destination: '/en/about-us#network', permanent: true },
    ]
  },
  experimental: {
    // Multiple build workers each start Miniflare and contend for the same local D1 file.
    cpus: 1,
  },
  images: {
    // Cap the generated srcset widths: source photography is at most 1600px
    // wide, and every extra width consumes one of Cloudflare Images' 5,000
    // free unique transformations per image per month.
    deviceSizes: [360, 640, 750, 828, 1080, 1440, 1920],
    // Narrow the fixed-width candidates too. The default list starts at 16px, so
    // a low-vw slot pulls in tiny widths nobody renders; capping it here keeps
    // every slot at nine srcset entries.
    imageSizes: [256, 384],
    // AVIF first: the optimizer picks the first listed format the client
    // announces in Accept, so anything without AVIF support still gets WebP.
    // Free against the quota -- Cloudflare bills one transformation per image
    // and parameter set regardless of how many output formats it serves.
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        // Only reachable from `next dev`, where mediaSource() keeps CMS URLs
        // relative for the built-in optimizer. Deployed, they are absolute and
        // matched by remotePatterns instead.
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/logos/**',
      },
      {
        pathname: '/photos/**',
      },
    ],
    // CMS uploads are addressed absolutely on deployed environments. The
    // OpenNext optimizer resolves relative sources through the static-assets
    // binding, which cannot see the R2 objects Payload streams, so only the
    // absolute form reaches them (see src/lib/media.ts). Patterns are baked into
    // the images manifest at build time and production ships the bundle staging
    // built, so every hostname one artifact can answer on must be listed here.
    remotePatterns: [
      { hostname: 'ichtusleuven.be', pathname: '/api/media/file/**', protocol: 'https' },
      { hostname: '*.ichtusleuven.be', pathname: '/api/media/file/**', protocol: 'https' },
      { hostname: '*.workers.dev', pathname: '/api/media/file/**', protocol: 'https' },
    ],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
