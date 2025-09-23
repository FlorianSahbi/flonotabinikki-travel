// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes "top-level" qui NE sont PAS des langues (à compléter au besoin)
const KNOWN_ROUTES = new Set(['explore', 'timeline', 'experience'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // ignore fichiers statiques, API, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0] // peut être undefined

  // 1) Pas de segment -> /fr
  if (!first) {
    url.pathname = '/fr'
    return NextResponse.redirect(url)
  }

  // 2) Déjà /fr/... -> OK
  if (first === 'fr') {
    return
  }

  // 3) Premier segment est une vraie route -> on préfixe par /fr (on ne retire rien)
  if (KNOWN_ROUTES.has(first)) {
    url.pathname = `/fr/${segments.join('/')}`
    return NextResponse.redirect(url)
  }

  // 4) Sinon, on considère que c'est une "langue" invalide -> on remplace par fr
  //    (= on retire le 1er segment et on garde le reste)
  const rest = segments.slice(1).join('/')
  url.pathname = `/fr${rest ? `/${rest}` : ''}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
