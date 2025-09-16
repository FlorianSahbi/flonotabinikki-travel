// page that renders HomeHero with random videos
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
  const { data: randomVideos, error: getRandomVideosError } =
    await supabase.rpc('get_random_videos')

  if (getRandomVideosError) {
    console.error('[supabase] get_random_videos:', getRandomVideosError)
    return null
  }

  const items = (randomVideos ?? [])
    .slice(0, PLACE_LABELS.length)
    .map((v: any, i: number) => ({
      id: String(v.id),
      src: String(v.main_url ?? ''),
      placeLabel: PLACE_LABELS[i] ?? null,
    }))
    .filter((x) => x.id && x.src)

  if (!items.length) return null

  return (
    <HomeHero
      items={items}
      title="PVT 2024 · One year across Japan"
      cta={{ label: 'Enter', href: '/explore' }}
      slideMs={4200}
      fadeMs={750}
    />
  )
}
