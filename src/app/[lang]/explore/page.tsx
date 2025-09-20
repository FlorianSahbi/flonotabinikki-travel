import ExploreSplitClient from '@/components/explore/ExploreSplitClient'
import ExploreMap from '@/components/explore/ExploreMap'
import { supabase } from '@/lib/supabaseClient'

export default async function ExplorePage({
  searchParams,
  params,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
  params: { lang?: string }
}) {
  const lang = params?.lang
  const focus = (
    Array.isArray(searchParams?.focus)
      ? searchParams?.focus[0]
      : searchParams?.focus
  ) as string | undefined

  const { data: videosWithCoordinates } = await supabase
    .from('videos')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  let initialContext: any[] | null = null
  if (focus) {
    const { data, error } = await supabase.rpc('feed_get_context_items', {
      target_id: focus,
      range_size: 3,
    })
    if (!error) initialContext = data ?? null
  }

  const points =
    videosWithCoordinates?.map((v) => ({
      id: v.id,
      lat: v.lat,
      lng: v.lng,
    })) ?? []

  return (
    <div className="h-dvh w-screen bg-black">
      {/* Desktop : split view */}
      <div className="hidden md:block h-full w-full">
        <ExploreSplitClient
          lang={lang}
          points={points}
          initialFocusId={focus ?? null}
          initialContextItems={initialContext}
        />
      </div>

      {/* Mobile : carte seule */}
      <div className="md:hidden h-full w-full">
        <ExploreMap points={points} />
      </div>
    </div>
  )
}
