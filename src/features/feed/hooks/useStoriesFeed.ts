// @path: src/features/feed/hooks/useStoriesFeed.ts
'use client'

import { useCallback, useMemo, useRef, useState, MutableRefObject } from 'react'
import type { FeedItem } from '@/features/feed'
import { feedGetItemsAfter, feedGetItemsBefore } from '@/features/feed'

type SwiperLike = {
  activeIndex: number
  slideTo: (index: number, speed?: number) => void
}

export function useStoriesFeed({
  initialId,
  initialItems,
  swiperRef,
  onPlay,
}: {
  initialId: string
  initialItems: FeedItem[]
  swiperRef: MutableRefObject<SwiperLike | null>
  onPlay?: (index: number) => void
}) {
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
        setItems((prev) => [...prev, ...fresh])
      }
    } finally {
      loadingNextRef.current = false
    }
  }, [items])

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
        setItems((prev) => [...fresh, ...prev])
        requestAnimationFrame(() => {
          sw?.slideTo(active + fresh.length, 0)
        })
      }
    } finally {
      loadingPrevRef.current = false
    }
  }, [items, swiperRef])

  const handleSlideChange = useCallback(
    (idx: number) => {
      onPlay?.(idx)
    },
    [onPlay]
  )

  return {
    items,
    initialIndex,
    handleSlideChange,
    appendAfter,
    prependBefore,
  }
}
