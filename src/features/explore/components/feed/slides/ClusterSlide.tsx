// @path: src/features/explore/components/feed/slides/ClusterSlide.tsx
'use client'

import type { FeedItem } from '@/features/feed'
import ClusterExperienceSlide from '@/features/feed/components/slides/ClusterExperienceSlide'

export default function ClusterSlide({ item }: { item: FeedItem }) {
  return <ClusterExperienceSlide item={item} href={`/experience/${item.id}`} />
}
