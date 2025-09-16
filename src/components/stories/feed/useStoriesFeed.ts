// src/components/stories/feed/useStoriesFeed.ts
'use client'

import { useCallback, useMemo, useRef, useState, MutableRefObject } from 'react'
import { useParams } from 'next/navigation'
import { FeedItem, feedGetItemsAfter, feedGetItemsBefore } from '@/lib/feed'
import type { MiniMapOverlayRef } from '@/components/stories/MiniMapOverlay'

type SwiperLike = {
  activeIndex: number
  slideTo: (index: number, speed?: number) => void
}

export function useStoriesFeed({
  initialId,
  initialItems,
  swiperRef,
  miniMapRef,
  onPlay,
}: {
  initialId: string
  initialItems: FeedItem[]
  swiperRef: MutableRefObject<SwiperLike | null>
  miniMapRef: MutableRefObject<MiniMapOverlayRef | null>
  onPlay?: (index: number) => void
}) {
  const { lang } = useParams<{ lang?: string }>()
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const idsRef = useRef(new Set(initialItems.map((v) => v.id)))
  const loadingNextRef = useRef(false)
  const loadingPrevRef = useRef(false)

  const initialIndex = useMemo(
    () =>
      Math.max(
        items.findIndex((v) => v.id === initialId),
        0
      ),
    [items, initialId]
  )

  const updateMiniMapPoints = useCallback(
    (arr: FeedItem[]) => {
      const pts = arr
        .filter((x) => x.lat != null && x.lng != null)
        .map((x) => ({ id: x.id, lat: x.lat!, lng: x.lng! }))
      miniMapRef.current?.updatePoints(pts)
    },
    [miniMapRef]
  )

  const appendAfter = useCallback(async () => {
    if (loadingNextRef.current || !items.length) return
    const last = items[items.length - 1]
    const lastTime = last?.recorded_at
    if (!lastTime) return

    loadingNextRef.current = true
    try {
      const skipClusterId = last?.kind === 'cluster' ? last.id : undefined
      const more = await feedGetItemsAfter(lastTime, 5, skipClusterId)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        fresh.forEach((v) => idsRef.current.add(v.id))
        setItems((prev) => {
          const updated = [...prev, ...fresh]
          updateMiniMapPoints(updated)
          return updated
        })
      }
    } finally {
      loadingNextRef.current = false
    }
  }, [items, updateMiniMapPoints])

  const prependBefore = useCallback(async () => {
    if (loadingPrevRef.current || !items.length) return
    const first = items[0]
    const firstTime = first?.recorded_at
    if (!firstTime) return

    loadingPrevRef.current = true
    try {
      const sw = swiperRef.current
      const skipClusterId = first?.kind === 'cluster' ? first.id : undefined
      const more = await feedGetItemsBefore(firstTime, 5, skipClusterId)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        const active = sw?.activeIndex ?? 0
        fresh.forEach((v) => idsRef.current.add(v.id))
        setItems((prev) => {
          const updated = [...fresh, ...prev]
          updateMiniMapPoints(updated)
          return updated
        })
        // conserve la slide visible
        requestAnimationFrame(() => {
          sw?.slideTo(active + fresh.length, 0)
        })
      }
    } finally {
      loadingPrevRef.current = false
    }
  }, [items, swiperRef, updateMiniMapPoints])

  const handleSlideChange = useCallback(
    (idx: number) => {
      onPlay?.(idx)

      const current = items[idx]
      // synchro URL (respecte [lang])
      if (current?.id) {
        const base = lang ? `/${lang}` : ''
        window.history.replaceState(null, '', `${base}/stories/${current.id}`)
        // highlight du point actif
        miniMapRef.current?.setActive(current.id)
      }
      // déplacement de la caméra si lat/lng dispo
      if (current?.lat != null && current?.lng != null) {
        miniMapRef.current?.flyTo(current.lng!, current.lat!)
      }
    },
    [items, onPlay, miniMapRef, lang]
  )

  return {
    items,
    initialIndex,
    handleSlideChange,
    appendAfter,
    prependBefore,
  }
}
