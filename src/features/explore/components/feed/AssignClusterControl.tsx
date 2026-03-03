// @path: src/features/explore/components/AssignClusterControl.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'

type ClusterRow = {
  id: string
  name: string
  description: string | null
  cover_url: string | null
}

export default function AssignClusterControl({
  activeId,
}: {
  activeId: string | null
}) {
  const [open, setOpen] = useState(false)

  // est-ce que l’activeId correspond à une vidéo ?
  const [isVideo, setIsVideo] = useState(false)
  const [videoClusterId, setVideoClusterId] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)

  // clusters
  const [clusters, setClusters] = useState<ClusterRow[]>([])
  const [loadingClusters, setLoadingClusters] = useState(false)

  // création rapide
  const [creating, setCreating] = useState(false)
  const [newClusterName, setNewClusterName] = useState('')
  const [newClusterDesc, setNewClusterDesc] = useState('')

  // lecture clusters au mount (léger)
  useEffect(() => {
    let cancelled = false
    setLoadingClusters(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('clusters')
        .select('id, name, description, cover_url')
        .order('name', { ascending: true })
      if (!cancelled) {
        if (error) console.warn('clusters fetch error', error)
        setClusters(data ?? [])
        setLoadingClusters(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // quand activeId change, on teste si c’est une vidéo et on récupère son cluster_id
  useEffect(() => {
    let cancelled = false
    setIsVideo(false)
    setVideoClusterId(null)
    if (!activeId) return
    setLoadingVideo(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, cluster_id')
        .eq('id', activeId)
        .maybeSingle()
      if (!cancelled) {
        if (!error && data?.id) {
          setIsVideo(true)
          setVideoClusterId(data.cluster_id ?? null)
        } else {
          setIsVideo(false)
          setVideoClusterId(null)
        }
        setLoadingVideo(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeId])

  const canShow = isVideo && !!activeId
  const btnLabel = useMemo(() => {
    if (!canShow) return 'Cluster'
    if (loadingVideo) return '…'
    return videoClusterId ? 'Cluster ✓' : 'Cluster'
  }, [canShow, loadingVideo, videoClusterId])

  // sauvegarde association cluster -> vidéo
  const handleSave = async () => {
    if (!activeId || !isVideo) return
    const payload = { cluster_id: videoClusterId ?? null }
    const { error } = await supabase
      .from('videos')
      .update(payload)
      .eq('id', activeId)
    if (error) {
      alert('❌ Update failed: ' + error.message)
      return
    }

    // upsert cluster_heads quand cluster défini
    if (videoClusterId) {
      try {
        const { data: first } = await supabase
          .from('videos')
          .select('recorded_at_local')
          .eq('cluster_id', videoClusterId)
          .not('recorded_at_local', 'is', null)
          .order('recorded_at_local', { ascending: true })
          .limit(1)
          .maybeSingle()

        const sortAt = first?.recorded_at_local ?? new Date().toISOString()

        await supabase
          .from('cluster_heads')
          .upsert([{ cluster_id: videoClusterId, sort_at: sortAt as string }], {
            onConflict: 'cluster_id',
          } as any)
      } catch (e) {
        console.warn('cluster_heads upsert skipped', e)
      }
    }

    alert('✅ Saved')
  }

  // création d’un cluster + assignation à la vidéo
  const handleCreateCluster = async () => {
    if (!newClusterName.trim()) {
      alert('Donne un nom de cluster 😉')
      return
    }
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('clusters')
        .insert({
          name: newClusterName.trim(),
          description: newClusterDesc.trim() || null,
        })
        .select('id, name, description, cover_url')
        .single()

      if (error) {
        alert('❌ Cluster non créé: ' + error.message)
        setCreating(false)
        return
      }

      setClusters((prev) =>
        data
          ? [...prev, data as ClusterRow].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          : prev
      )
      if (data?.id) setVideoClusterId(data.id)

      // init cluster_heads
      try {
        await supabase
          .from('cluster_heads')
          .upsert(
            [{ cluster_id: data!.id, sort_at: new Date().toISOString() }],
            {
              onConflict: 'cluster_id',
            } as any
          )
      } catch {}

      setNewClusterName('')
      setNewClusterDesc('')
    } finally {
      setCreating(false)
    }
  }

  if (!canShow) {
    // bouton discret désactivé si point actif n’est pas une vidéo
    return (
      <div className="absolute left-3 bottom-3 z-[70] md:left-4 md:bottom-4">
        <button
          disabled
          className="rounded bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400 ring-1 ring-white/10 cursor-not-allowed"
          title="Select a video point to assign a cluster"
        >
          Cluster
        </button>
      </div>
    )
  }

  return (
    <div className="absolute left-3 bottom-3 z-[70] md:left-4 md:bottom-4">
      {/* bouton toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-black/70 px-3 py-2 text-xs text-white ring-1 ring-white/15 hover:bg-black/80 backdrop-blur"
        title="Assigner un cluster à la vidéo active"
      >
        {btnLabel}
      </button>

      {open && (
        <div className="mt-2 w-[280px] rounded-lg bg-neutral-950/90 p-3 text-sm text-white ring-1 ring-white/15 backdrop-blur">
          <div className="mb-2 font-semibold">Assigner un cluster</div>

          <div className="flex gap-2 items-center">
            <select
              value={videoClusterId ?? ''}
              onChange={(e) => setVideoClusterId(e.target.value || null)}
              className="flex-1 rounded bg-neutral-900/70 px-2 py-1.5 ring-1 ring-white/10 focus:outline-none"
              disabled={loadingClusters}
            >
              <option value="">— No cluster —</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setVideoClusterId(null)}
              className="rounded bg-white/10 px-2 py-1.5 ring-1 ring-white/10 hover:bg-white/16"
              title="Retirer le cluster"
            >
              Remove
            </button>
          </div>

          {/* création rapide */}
          <div className="mt-3 grid gap-2">
            <input
              value={newClusterName}
              onChange={(e) => setNewClusterName(e.target.value)}
              placeholder="New cluster name"
              className="rounded bg-neutral-900/70 px-2 py-1.5 ring-1 ring-white/10 focus:outline-none"
            />
            <input
              value={newClusterDesc}
              onChange={(e) => setNewClusterDesc(e.target.value)}
              placeholder="Description (optional)"
              className="rounded bg-neutral-900/70 px-2 py-1.5 ring-1 ring-white/10 focus:outline-none"
            />
            <button
              onClick={handleCreateCluster}
              disabled={creating}
              className="rounded bg-emerald-500/90 px-3 py-1.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {creating ? 'Creating…' : '➕ Create & assign'}
            </button>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="rounded bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/16"
            >
              💾 Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
