import { type NextRequest, NextResponse } from 'next/server'

import { isProductionDeployment } from '@/lib/seo'

// OpenNext Cloudflare 1.20 does not yet support Next.js Node proxy handlers.
export const runtime = 'experimental-edge'

export function middleware(request: NextRequest) {
  const locale = request.nextUrl.pathname.split('/')[1]
  const headers = new Headers(request.headers)
  headers.set('x-site-locale', locale === 'en' ? 'en' : 'nl')
  const response = NextResponse.next({ request: { headers } })
  if (!isProductionDeployment()) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
  // Next marks every dynamic render `no-store`, which is the one directive that
  // disqualifies a page from the back/forward cache. These pages still are not
  // stored by shared caches and still revalidate on every navigation; they just
  // become bfcache-eligible. Scoped to the locale prefixes so /api and /admin
  // keep their own headers, and set before the two no-store branches below so
  // those keep overriding it.
  if (/^\/(?:nl|en)(?:\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
  }
  if (/^\/(?:nl|en)\/registration\/cancel\//.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
  if (/^\/(?:nl|en)\/preview(?:\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
