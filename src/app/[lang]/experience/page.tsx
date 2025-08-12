import ExperienceView from '@/components/experience/ExperienceView'
import { supabase } from '@/lib/supabaseClient'

export default async function ExperiencePage() {
  const { data, error } = await supabase.rpc('get_random_videos')

  if (error) {
    console.error('Supabase error fetching videos:', error)
    return null
  }

  const event = {
    type: 'Festival',
    title: 'Hanami à Kyoto',
    description:
      'Célébration des cerisiers en fleurs au bord de la rivière Kamo.',
    longDescription:
      'Chaque printemps, Kyoto se transforme en un tableau vivant lorsque les cerisiers fleurissent. Musique, stands, et lumière dorée au coucher du soleil.',
    startDate: '2025-04-05',
    endDate: '2025-04-07',
    videos: data.map((v) => ({
      id: v.id,
      src: v.bucket_url as string,
    })),
  }

  return <ExperienceView event={event} />
}
