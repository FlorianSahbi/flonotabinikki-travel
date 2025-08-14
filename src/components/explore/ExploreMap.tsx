'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  points: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]
}

export default function ExploreMap({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const router = useRouter()
  const [focusId, setFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [138.0, 37.0],
      zoom: 4,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      const fc = {
        type: 'FeatureCollection' as const,
        features: points.map((p) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [p.lng!, p.lat!] },
          properties: { id: p.id },
        })),
      }

      map.addSource('videos', { type: 'geojson', data: fc })

      // Points normaux
      map.addLayer({
        id: 'videos-points',
        type: 'circle',
        source: 'videos',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF5722',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      })

      // Point actif (bleu)
      map.addLayer({
        id: 'active-point',
        type: 'circle',
        source: 'videos',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 8,
          'circle-color': '#3B82F6', // bleu visible
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
        },
      })

      const setActive = (id: string | null) => {
        map.setFilter(
          'active-point',
          id ? ['==', ['get', 'id'], id] : ['==', ['get', 'id'], '']
        )
      }

      // Focus initial
      const url = new URL(window.location.href)
      const initialFocus = url.searchParams.get('focus')
      if (initialFocus) {
        setFocusId(initialFocus)
        setActive(initialFocus)
        const t = points.find((p) => p.id === initialFocus)
        if (t) {
          map.jumpTo({ center: [t.lng!, t.lat!], zoom: 7.5 })
        }
      }

      // Click sur point
      map.on('click', 'videos-points', (e) => {
        const f = e.features?.[0]
        const id = f?.properties?.id as string | undefined
        if (!id) return

        const params = new URLSearchParams(window.location.search)
        params.set('focus', id)
        window.history.replaceState(null, '', `?${params.toString()}`)
        setFocusId(id)
        setActive(id)

        const geom = f?.geometry
        if (geom && geom.type === 'Point') {
          const [lng, lat] = geom.coordinates as [number, number]
          map.easeTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 7.5),
            duration: 400,
          })
        }
      })

      map.on('mouseenter', 'videos-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'videos-points', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    return () => map.remove()
  }, [router, points])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('videos') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    src.setData({
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng!, p.lat!] },
        properties: { id: p.id },
      })),
    })
  }, [points])

  return (
    <>
      <div ref={containerRef} className="h-dvh w-screen" />
      {focusId && (
        <button
          onClick={() => router.push(`/stories/${focusId}`)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-4 py-2 shadow-lg hover:bg-orange-600 transition"
        >
          Voir la story
        </button>
      )}
    </>
  )
}
