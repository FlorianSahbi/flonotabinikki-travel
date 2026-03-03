// @path: src/features/explore/components/feed/slides/ClusterSlide.tsx
'use client'

import type { FeedItem } from '@/features/feed'
import ClusterExperienceSlide from '@/features/feed/components/slides/ClusterExperienceSlide'

export default function ClusterSlide({
  item,
  onOpen,
}: {
  item: FeedItem
  onOpen?: (id: string) => void
}) {
  // NOTE: we do NOT navigate; clicking the slide triggers the “expand cluster” mode.
  return (
    <ClusterExperienceSlide item={item} onClick={() => onOpen?.(item.id)} />
  )
}
