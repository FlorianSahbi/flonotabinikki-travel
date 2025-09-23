// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const KNOWN_ROUTES = new Set(['explore', 'timeline', 'experience'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (!first) {
    url.pathname = '/fr'
    return NextResponse.redirect(url)
  }

  if (first === 'fr') {
    return
  }

  if (KNOWN_ROUTES.has(first)) {
    url.pathname = `/fr/${segments.join('/')}`
    return NextResponse.redirect(url)
  }

  const rest = segments.slice(1).join('/')
  url.pathname = `/fr${rest ? `/${rest}` : ''}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
