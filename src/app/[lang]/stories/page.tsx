import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'

export default async function StoriesPage() {
  const { data, error } = await supabase
    .from('videos')
    .select('id, bucket_url, recorded_at, lat, lng, position')
    .eq('is_published', true)
    .order('recorded_at', { ascending: true }) // Tri par ordre ascendant
    .limit(3)

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

  return <StoriesFeed data={data} />
}
