import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return
  }

  if (!pathname.startsWith('/fr')) {
    const url = request.nextUrl.clone()
    url.pathname = `/fr${pathname}`
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
