import { supabase } from '@/lib/supabaseClient'
import ExperienceView from '@/components/experience/ExperienceView'
import type React from 'react'

export default async function ExperienceByIdPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const { id } = await params

  const { data: cluster, error: cErr } = await supabase
    .from('clusters')
    .select('*')
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
    .select('*')
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

  return <ExperienceView data={{ ...cluster, videos }} />
}
