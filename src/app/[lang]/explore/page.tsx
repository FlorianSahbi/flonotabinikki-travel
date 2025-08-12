import ExploreMap from '@/components/explore/ExploreMap'
import { supabase } from '@/lib/supabaseClient'

export default async function ExplorePage() {
  const { data } = await supabase
    .from('videos')
    .select('id, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  return <ExploreMap points={data ?? []} />
}
