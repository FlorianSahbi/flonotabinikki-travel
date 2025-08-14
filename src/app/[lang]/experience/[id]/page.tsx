import { supabase } from '@/lib/supabaseClient'
import ExperienceView from '@/components/experience/ExperienceView'

export default async function ExperienceByIdPage({
  params,
}: {
  params: { id: string; lang: string }
}) {
  const { id } = params

  const { data: cluster, error: cErr } = await supabase
    .from('clusters')
    .select('id, name, description, preview')
    .eq('id', id)
    .maybeSingle()

  if (cErr) {
    console.error('Supabase error fetching cluster:', cErr)
    return (
      <div className="p-6 text-white">
        Erreur lors du chargement de l’expérience.
      </div>
    )
  }
  if (!cluster)
    return <div className="p-6 text-white">Expérience introuvable.</div>

  const { data: videos, error: vErr } = await supabase
    .from('videos')
    .select(
      'id, bucket_url, recorded_at, lat, lng, position, title, description'
    )
    .eq('cluster_id', id)
    .order('recorded_at', { ascending: true })

  if (vErr) {
    console.error('Supabase error fetching cluster videos:', vErr)
    return (
      <div className="p-6 text-white">
        Erreur lors du chargement des vidéos.
      </div>
    )
  }

  const event = {
    type: 'Expérience',
    title: cluster.name,
    description: cluster.description ?? undefined,
    preview: cluster.preview ?? undefined,
    videos: (videos ?? []).map((v) => ({
      id: v.id,
      src: v.bucket_url as string,
      recorded_at: v.recorded_at as string,
      lat: v.lat as number | null,
      lng: v.lng as number | null,
      position: v.position as number | null,
      title: v.title as string | null,
      description: v.description as string | null,
    })),
  }

  return <ExperienceView event={event} />
}
