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

    // Charger paramètres sauvegardés
    const savedState = localStorage.getItem('exploreMapState')
    let startCenter: [number, number] = [138.0, 37.0]
    let startZoom = 4.2
    let startPitch = 40

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (Array.isArray(parsed.center) && parsed.center.length === 2) {
          startCenter = parsed.center
        }
        if (typeof parsed.zoom === 'number') startZoom = parsed.zoom
        if (typeof parsed.pitch === 'number') startPitch = parsed.pitch
      } catch {}
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: startCenter,
      zoom: startZoom,
      pitch: startPitch,
      bearing: -10,
      attributionControl: false,
    })
    mapRef.current = map

    // Lock pitch → à chaque move on réapplique le pitch
    map.on('pitch', () => {
      if (map.getPitch() !== startPitch) {
        map.setPitch(startPitch)
      }
    })

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
      map.addLayer({
        id: 'videos-points',
        type: 'circle',
        source: 'videos',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'case',
            ['==', ['get', 'id'], focusId],
            '#2196F3', // point actif → bleu
            '#FF5722', // point normal → orange
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      })

      // Focus initial depuis l'URL
      const url = new URL(window.location.href)
      const initialFocus = url.searchParams.get('focus')
      if (initialFocus) {
        setFocusId(initialFocus)
        const target = points.find((p) => p.id === initialFocus)
        if (target) {
          map.jumpTo({ center: [target.lng!, target.lat!], zoom: 7.5 })
        }
      }

      // Click sur un point
      map.on('click', 'videos-points', (e) => {
        const f = e.features?.[0]
        const id = f?.properties?.id as string | undefined
        if (!id) return

        const params = new URLSearchParams(window.location.search)
        params.set('focus', id)
        window.history.replaceState(null, '', `?${params.toString()}`)
        setFocusId(id)

        const coords = (f!.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ]
        map.easeTo({
          center: coords,
          zoom: Math.max(map.getZoom(), 7.5),
          duration: 400,
        })
      })

      map.on('mouseenter', 'videos-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'videos-points', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    // Sauvegarde état uniquement à la fin du mouvement
    map.on('moveend', () => {
      const center = map.getCenter()
      localStorage.setItem(
        'exploreMapState',
        JSON.stringify({
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          pitch: startPitch, // toujours le pitch verrouillé
        })
      )
    })

    return () => map.remove()
  }, [router, points])

  // Update dynamique des points
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
