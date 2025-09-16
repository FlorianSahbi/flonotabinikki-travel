// src/app/[lang]/explore/page.tsx
import ExploreMap from '@/components/explore/ExploreMap'
import { supabase } from '@/lib/supabaseClient'

export default async function ExplorePage() {
  const { data: videosWithCoordinates } = await supabase
    .from('videos')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  return <ExploreMap points={videosWithCoordinates ?? []} />
}
