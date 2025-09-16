// src/components/stories/StoriesFeed/ClusterSlide.tsx
'use client'

import ClusterExperienceSlide from '@/components/stories/ClusterExperienceSlide'
import { FeedItem } from '@/lib/feed'

export default function ClusterSlide({ item }: { item: FeedItem }) {
  return <ClusterExperienceSlide item={item} href={`/experience/${item.id}`} />
}
