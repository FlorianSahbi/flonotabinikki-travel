'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DesktopRedirect({
  focusId,
  lang,
}: {
  focusId: string
  lang?: string
}) {
  const router = useRouter()

  useEffect(() => {
    // si écran ≥ md (768px), redirige vers /explore?focus=...
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (isDesktop && focusId) {
      const base = lang ? `/${lang}` : ''
      router.replace(`${base}/explore?focus=${encodeURIComponent(focusId)}`)
    }
  }, [focusId, lang, router])

  return null
}
