// @path: src/app/[lang]/experience/[id]/page.tsx
import ExperienceView from '@/features/experience/ExperienceView'
import { supabase } from '@/shared/lib/supabaseClient'

function formatLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

export default async function ExperienceByIdPage() {
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .order('recorded_at_local', { ascending: true })
    .limit(5)

  if (error) {
    console.error('Supabase error fetching videos:', error)
    return <div className="p-6 text-white">Error loading videos.</div>
  }
  if (!videos || videos.length === 0) {
    return <div className="p-6 text-white">No videos found.</div>
  }

  const dates = videos
    .map((v) => v.recorded_at_local)
    .filter((s): s is string => !!s)

  const first = dates[0] ?? null
  const last = dates[dates.length - 1] ?? null

  const experienceData = {
    name: videos[0]?.title ?? 'Video selection',
    description: videos[0]?.description ?? '',
    dateRangeLabels: [formatLabel(first), formatLabel(last)].filter(
      Boolean
    ) as string[],
    videos,
  }

  return <ExperienceView data={experienceData} />
}
