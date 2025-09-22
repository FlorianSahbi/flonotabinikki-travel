// src/components/stories/DesktopRedirect.tsx
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
  console.log('okoko')
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    console.log(isDesktop, focusId)
    if (isDesktop && focusId) {
      const base = lang ? `/${lang}` : ''
      router.replace(`${base}/explore?focus=${encodeURIComponent(focusId)}`)
    }
  }, [focusId, lang, router])

  return null
}
