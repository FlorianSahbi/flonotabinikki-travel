'use client'

import { useCallback, useEffect } from 'react'
import ExploreMap from '@/components/explore/ExploreMap'
import StoriesFeed from '@/components/stories/StoriesFeed'
import type { FeedItem } from '@/lib/feed'
import {
  useExploreStore,
  useFocusId,
  useFocusSource,
  useContextForFocus,
  useLoading,
} from '@/lib/state/useExploreStore'

type Point = { id: string; lat: number; lng: number }

export default function ExploreSplitClient({
  lang,
  points,
  initialFocusId,
  initialContextItems,
}: {
  lang?: string
  points: Point[]
  initialFocusId: string | null
  initialContextItems: FeedItem[] | null
}) {
  const focusId = useFocusId()
  const focusSource = useFocusSource()
  const items = useContextForFocus()
  const loading = useLoading()

  const setFocus = useExploreStore((s) => s.setFocus)
  const hydrateFromUrl = useExploreStore((s) => s.hydrateFromUrl)
  const seedContext = useExploreStore((s) => s.seedContext)
  const loadContext = useExploreStore((s) => s.loadContext)

  // 1) priorité SSR/URL
  useEffect(() => {
    if (initialFocusId) {
      setFocus(initialFocusId, {
        fetch: false,
        syncUrl: false,
        source: 'system',
      })
      if (initialContextItems?.length)
        seedContext(initialFocusId, initialContextItems)
    } else {
      hydrateFromUrl()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) auto-focus sur le 1er point si rien en URL
  useEffect(() => {
    if (!focusId && points.length) {
      const firstId = points[0].id
      ;(async () => {
        await loadContext(firstId, { force: true })
        setFocus(firstId, { fetch: false, syncUrl: true, source: 'system' })
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, points.length])

  // 3) CLIC CARTE → refetch forcé + switch stories (sans quitter /explore)
  const handleMapSelect = useCallback(
    async (id: string) => {
      await loadContext(id, { force: true }) // refait la requête Supabase
      setFocus(id, { fetch: false, syncUrl: true, source: 'map' })
    },
    [loadContext, setFocus]
  )

  const base = lang ? `/${lang}` : ''

  // remount StoriesFeed seulement si ça vient de la MAP (changement “dur”)
  const feedKey = focusSource === 'map' && focusId ? `map-${focusId}` : 'static'

  if (!points.length) {
    return (
      <div className="flex h-full w-full text-neutral-300">
        <div className="flex-1 flex items-center justify-center border-r border-neutral-800">
          Aucun point reçu
        </div>
        <div
          className="flex-none flex items-center justify-center"
          style={{ width: 'calc(100svh * 9 / 16)' }}
        >
          Stories en attente d’un focus
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      {/* Map à gauche — occupe tout l’espace restant */}
      <div className="relative flex-1 min-w-0 h-full">
        <ExploreMap
          variant="split"
          points={points}
          onSelectId={handleMapSelect}
        />
      </div>

      {/* Stories à droite — largeur = 9:16 basée sur la hauteur viewport */}
      <div
        className="relative flex-none h-full bg-black border-l border-neutral-800 overflow-hidden"
        style={{ width: 'calc(100svh * 9 / 16)' }}
      >
        {focusId && items?.length ? (
          <StoriesFeed key={feedKey} initialId={focusId} initialItems={items} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            {loading ? 'Chargement…' : 'Clique un point sur la carte'}
          </div>
        )}

        {focusId && (
          <button
            onClick={() =>
              window.open(
                `${base}/stories/${encodeURIComponent(focusId)}`,
                '_blank'
              )
            }
            className="absolute top-3 right-3 rounded-full bg-neutral-800/70 backdrop-blur px-3 py-1.5 text-xs text-white hover:bg-neutral-700"
          >
            Ouvrir en onglet
          </button>
        )}
      </div>
    </div>
  )
}
