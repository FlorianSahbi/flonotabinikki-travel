import HomeHero from '@/components/home/HomeHero'
import { supabase } from '@/lib/supabaseClient'

const PLACE_LABELS = [
  'Fushimi Inari Taisha, Kyoto',
  'Ōnaruto Bridge & Naruto Whirlpools, Tokushima',
  'Shibuya Crossing, Tokyo',
  'Itsukushima Shrine, Hiroshima',
  'Mount Fuji, Yamanashi',
  'Dotonbori, Osaka',
] as const

export default async function Page() {
  const { data, error } = await supabase.rpc('get_random_videos')

  if (error) {
    console.error('Supabase error fetching videos:', error)
    return null
  }

  const items = (data ?? []).map((v, i) => ({
    id: v.id,
    videoUrl: v.bucket_url as string,
    placeLabel: PLACE_LABELS[i] ?? null,
  }))

  if (!items.length) return null

  return (
    <HomeHero
      items={items}
      title="PVT 2024 Un an dans tout le Japon"
      cta={{ label: 'Entrer', href: '/explore' }}
    />
  )
}
