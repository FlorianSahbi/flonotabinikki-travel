'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'
import { useExploreStore, useFocusId } from '@/lib/state/useExploreStore'

type Props = {
  points: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]
  /** si fourni, c’est l’orchestrateur qui gère le fetch + setFocus (split) */
  onSelectId?: (id: string) => void
  /** "split" = pas de bouton; "mobile" = bouton View story visible */
  variant?: 'split' | 'mobile'
}

export default function ExploreMap({
  points,
  onSelectId,
  variant = 'mobile',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const pointsRef = useRef<Props['points']>(points)

  const setFocus = useExploreStore((s) => s.setFocus)
  const setViewport = useExploreStore((s) => s.setViewport)
  const loadContext = useExploreStore((s) => s.loadContext)
  const focusId = useFocusId()

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const tokenMissing = !token

  // garder la dernière version des points
  useEffect(() => {
    pointsRef.current = points
  }, [points])

  // util: pousser les points dans la source si prête
  const setVideosData = () => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('videos') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const data = {
      type: 'FeatureCollection' as const,
      features: (pointsRef.current ?? []).map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng!, p.lat!] },
        properties: { id: p.id },
      })),
    }
    src.setData(data)
  }

  // init map (1 seule fois)
  useEffect(() => {
    if (!mapContainerRef.current || tokenMissing) return
    mapboxgl.accessToken = token!

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [138.0, 37.0],
      zoom: 4,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('error', (e) => console.error('[mapbox] error', e?.error))

    map.on('moveend', () => {
      const c = map.getCenter()
      setViewport({ lng: c.lng, lat: c.lat, zoom: map.getZoom() })
    })

    map.on('load', () => {
      map.addSource('videos', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'videos-points',
        type: 'circle',
        source: 'videos',
        paint: {
          'circle-radius': 4,
          'circle-color': '#FF5722',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      })

      map.addLayer({
        id: 'active-point',
        type: 'circle',
        source: 'videos',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 8,
          'circle-color': '#3B82F6',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
        },
      })

      // injecter les points actuels
      setVideosData()

      // focus initial via URL (le split s’occupe sinon de l’auto-focus)
      const initialUrlFocus = new URL(window.location.href).searchParams.get(
        'focus'
      )
      if (initialUrlFocus) {
        map.setFilter('active-point', ['==', ['get', 'id'], initialUrlFocus])
        const p = pointsRef.current.find((pt) => pt.id === initialUrlFocus)
        if (p) map.jumpTo({ center: [p.lng!, p.lat!], zoom: 7.5 })
      }

      // clic sur point
      map.on('click', 'videos-points', async (event) => {
        const feature = event.features?.[0]
        const videoId = feature?.properties?.id as string | undefined
        if (!videoId) return

        if (onSelectId) {
          // MODE SPLIT : l’orchestrateur gère le fetch + setFocus
          onSelectId(videoId)
        } else {
          // MODE MOBILE : on fait le fetch forcé ici puis on setFocus
          await loadContext(videoId, { force: true })
          setFocus(videoId, { fetch: false, syncUrl: true, source: 'map' })
        }

        const geometry = feature?.geometry
        if (geometry?.type === 'Point') {
          const [lng, lat] = geometry.coordinates as [number, number]
          map.easeTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 7.5),
            duration: 400,
          })
        }
      })

      map.on(
        'mouseenter',
        'videos-points',
        () => (map.getCanvas().style.cursor = 'pointer')
      )
      map.on(
        'mouseleave',
        'videos-points',
        () => (map.getCanvas().style.cursor = '')
      )
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenMissing, token, setViewport, loadContext, setFocus, onSelectId])

  // update des points même si 'load' pas encore passé
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const trySet = () => {
      const src = map.getSource('videos') as mapboxgl.GeoJSONSource | undefined
      if (src) setVideosData()
    }

    if (map.isStyleLoaded()) {
      trySet()
    } else {
      const onLoad = () => {
        trySet()
        map.off('load', onLoad)
      }
      map.on('load', onLoad)
    }
  }, [points])

  // highlight + recentrage doux quand le focus change (stories, auto-focus…)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('active-point')) return

    map.setFilter(
      'active-point',
      focusId ? ['==', ['get', 'id'], focusId] : ['==', ['get', 'id'], '']
    )

    if (focusId) {
      const p = pointsRef.current.find((pt) => pt.id === focusId)
      if (p) {
        const current = map.getCenter()
        const dist = Math.hypot(current.lng - p.lng!, current.lat - p.lat!)
        if (dist > 0.0005) {
          map.easeTo({
            center: [p.lng!, p.lat!],
            zoom: Math.max(map.getZoom(), 7.5),
            duration: 400,
          })
        }
      }
    }
  }, [focusId])

  return (
    <>
      {tokenMissing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 text-white">
          NEXT_PUBLIC_MAPBOX_TOKEN manquant
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full min-h-[300px]" />
      {/* Pas de bouton ici en split; en mobile tu peux réactiver si besoin */}
    </>
  )
}
