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
