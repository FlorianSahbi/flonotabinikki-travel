// @path: src/features/feed/utils.ts
import { FeedItem } from '@/features/feed'

export function dateLabel(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function mapPointsFromItems(items: FeedItem[]) {
  return items
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({ id: v.id, lat: v.lat!, lng: v.lng! }))
}

export function centerFromItems(
  items: FeedItem[],
  initialIndex: number
): [number, number] {
  const lng = items[initialIndex]?.lng ?? 0
  const lat = items[initialIndex]?.lat ?? 0
  return [lng, lat]
}
