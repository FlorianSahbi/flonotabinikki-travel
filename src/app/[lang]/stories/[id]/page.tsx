import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'

export default async function StoriesPage({
  params,
}: {
  params: { id: string }
}) {
  const { data, error } = await supabase.rpc('get_context_videos', {
    target_id: params.id,
  })

  if (error) {
    console.error('Erreur lors de la récupération des vidéos:', error.message)
    return (
      <div className="p-6 text-red-500">
        Une erreur est survenue lors du chargement des vidéos.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="p-6">Aucune vidéo disponible</div>
  }

  return <StoriesFeed data={data} initialId={params.id} />
}
