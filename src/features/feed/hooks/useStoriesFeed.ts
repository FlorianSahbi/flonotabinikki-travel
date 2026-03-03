// @path: src/features/feed/hooks/useStoriesFeed.ts
'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MutableRefObject,
} from 'react'
import type { FeedItem } from '@/features/feed'
import { feedGetItemsAfter, feedGetItemsBefore } from '@/features/feed'

type SwiperLike = {
  activeIndex: number
  slideTo: (index: number, speed?: number) => void
}

// Config
const FETCH_BATCH_SIZE = 5
const MAX_ITEMS = 100 // Sliding window - trim beyond this
const TRIM_THRESHOLD = 120 // Start trimming when we hit this
const DEBOUNCE_MS = 300
const MAX_RETRIES = 2

type LoadState = 'idle' | 'loading' | 'error'

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
  // Core state
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [loadStateNext, setLoadStateNext] = useState<LoadState>('idle')
  const [loadStatePrev, setLoadStatePrev] = useState<LoadState>('idle')

  // Refs for stable access (avoid stale closures)
  const itemsRef = useRef(items)
  const idsRef = useRef(new Set(initialItems.map((v) => v.id)))
  const abortRef = useRef<AbortController | null>(null)
  const debounceNextRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncePrevRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep itemsRef in sync
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceNextRef.current) clearTimeout(debounceNextRef.current)
      if (debouncePrevRef.current) clearTimeout(debouncePrevRef.current)
    }
  }, [])

  // Reset when initialItems change (e.g., cluster drill-down)
  useEffect(() => {
    const newIds = new Set(initialItems.map((v) => v.id))
    // Only reset if items actually changed
    if (initialItems.length > 0 && !initialItems.every((it) => idsRef.current.has(it.id))) {
      setItems(initialItems)
      idsRef.current = newIds
    }
  }, [initialItems])

  const initialIndex = useMemo(
    () => Math.max(items.findIndex((v) => v.id === initialId), 0),
    [items, initialId]
  )

  // Fetch with retry
  const fetchWithRetry = async <T,>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> => {
    let lastError: Error | null = null
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn()
      } catch (e) {
        lastError = e as Error
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)))
      }
    }
    throw lastError
  }

  // Trim items to keep memory bounded (sliding window)
  const trimItems = useCallback(
    (newItems: FeedItem[], activeIdx: number): FeedItem[] => {
      if (newItems.length <= TRIM_THRESHOLD) return newItems

      // Keep a window around active index
      const halfWindow = Math.floor(MAX_ITEMS / 2)
      const start = Math.max(0, activeIdx - halfWindow)
      const end = Math.min(newItems.length, activeIdx + halfWindow)

      const trimmed = newItems.slice(start, end)

      // Update idsRef
      idsRef.current = new Set(trimmed.map((v) => v.id))

      return trimmed
    },
    []
  )

  // APPEND (load more after current items)
  const appendAfter = useCallback(async () => {
    // Debounce
    if (debounceNextRef.current) clearTimeout(debounceNextRef.current)

    debounceNextRef.current = setTimeout(async () => {
      const currentItems = itemsRef.current
      if (loadStateNext === 'loading' || !currentItems.length) return

      const last = currentItems[currentItems.length - 1]
      const lastTime = last?.recorded_at
      if (!lastTime) return

      setLoadStateNext('loading')
      try {
        const skipClusterId = last?.kind === 'cluster' ? last.id : undefined
        const more = await fetchWithRetry(() =>
          feedGetItemsAfter(lastTime, FETCH_BATCH_SIZE, skipClusterId)
        )

        const fresh = more.filter((v) => !idsRef.current.has(v.id))
        if (fresh.length) {
          fresh.forEach((v) => idsRef.current.add(v.id))
          setItems((prev) => {
            const activeIdx = swiperRef.current?.activeIndex ?? 0
            const combined = [...prev, ...fresh]
            return trimItems(combined, activeIdx)
          })
        }
        setLoadStateNext('idle')
      } catch (e) {
        console.error('appendAfter failed:', e)
        setLoadStateNext('error')
        // Reset to idle after delay so user can retry
        setTimeout(() => setLoadStateNext('idle'), 2000)
      }
    }, DEBOUNCE_MS)
  }, [loadStateNext, swiperRef, trimItems])

  // PREPEND (load more before current items)
  const prependBefore = useCallback(async () => {
    // Debounce
    if (debouncePrevRef.current) clearTimeout(debouncePrevRef.current)

    debouncePrevRef.current = setTimeout(async () => {
      const currentItems = itemsRef.current
      if (loadStatePrev === 'loading' || !currentItems.length) return

      const first = currentItems[0]
      const firstTime = first?.recorded_at
      if (!firstTime) return

      setLoadStatePrev('loading')
      try {
        const sw = swiperRef.current
        const skipClusterId = first?.kind === 'cluster' ? first.id : undefined
        const more = await fetchWithRetry(() =>
          feedGetItemsBefore(firstTime, FETCH_BATCH_SIZE, skipClusterId)
        )

        const fresh = more.filter((v) => !idsRef.current.has(v.id))
        if (fresh.length && sw) {
          const activeIndexBefore = sw.activeIndex

          fresh.forEach((v) => idsRef.current.add(v.id))
          setItems((prev) => {
            const combined = [...fresh, ...prev]
            const newActiveIdx = activeIndexBefore + fresh.length
            return trimItems(combined, newActiveIdx)
          })
          // Note: VerticalVideoSwiper handles position adjustment via currentItemIdRef
        }
        setLoadStatePrev('idle')
      } catch (e) {
        console.error('prependBefore failed:', e)
        setLoadStatePrev('error')
        setTimeout(() => setLoadStatePrev('idle'), 2000)
      }
    }, DEBOUNCE_MS)
  }, [loadStatePrev, swiperRef, trimItems])

  const handleSlideChange = useCallback(
    (idx: number) => {
      onPlay?.(idx)
    },
    [onPlay]
  )

  // Check if we're near edges (for preemptive loading)
  const checkAndLoad = useCallback(
    (idx: number) => {
      const total = itemsRef.current.length
      // Load more when 2 slides from edge
      if (idx >= total - 2) appendAfter()
      if (idx <= 1) prependBefore()
    },
    [appendAfter, prependBefore]
  )

  return {
    items,
    initialIndex,
    handleSlideChange,
    appendAfter,
    prependBefore,
    checkAndLoad,
    isLoadingNext: loadStateNext === 'loading',
    isLoadingPrev: loadStatePrev === 'loading',
  }
}
