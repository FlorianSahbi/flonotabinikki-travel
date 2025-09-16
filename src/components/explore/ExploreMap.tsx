// src/components/explore/ExploreMap.tsx
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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const router = useRouter()
  const [focusId, setFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [138.0, 37.0],
      zoom: 4,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    })
    mapRef.current = mapInstance

    mapInstance.on('load', () => {
      const featureCollection = {
        type: 'FeatureCollection' as const,
        features: points.map((point) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.lng!, point.lat!],
          },
          properties: { id: point.id },
        })),
      }

      mapInstance.addSource('videos', {
        type: 'geojson',
        data: featureCollection,
      })

      mapInstance.addLayer({
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

      mapInstance.addLayer({
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

      const setActivePoint = (id: string | null) => {
        mapInstance.setFilter(
          'active-point',
          id ? ['==', ['get', 'id'], id] : ['==', ['get', 'id'], '']
        )
      }

      const currentUrl = new URL(window.location.href)
      const initialFocusId = currentUrl.searchParams.get('focus')
      if (initialFocusId) {
        setFocusId(initialFocusId)
        setActivePoint(initialFocusId)
        const focusedPoint = points.find((point) => point.id === initialFocusId)
        if (focusedPoint) {
          mapInstance.jumpTo({
            center: [focusedPoint.lng!, focusedPoint.lat!],
            zoom: 7.5,
          })
        }
      }

      mapInstance.on('click', 'videos-points', (event) => {
        const feature = event.features?.[0]
        const videoId = feature?.properties?.id as string | undefined
        if (!videoId) return

        const params = new URLSearchParams(window.location.search)
        params.set('focus', videoId)
        window.history.replaceState(null, '', `?${params.toString()}`)
        setFocusId(videoId)
        setActivePoint(videoId)

        const geometry = feature?.geometry
        if (geometry && geometry.type === 'Point') {
          const [lng, lat] = geometry.coordinates as [number, number]
          mapInstance.easeTo({
            center: [lng, lat],
            zoom: Math.max(mapInstance.getZoom(), 7.5),
            duration: 400,
          })
        }
      })

      mapInstance.on('mouseenter', 'videos-points', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })
      mapInstance.on('mouseleave', 'videos-points', () => {
        mapInstance.getCanvas().style.cursor = ''
      })
    })

    return () => mapInstance.remove()
  }, [router, points])

  useEffect(() => {
    const mapInstance = mapRef.current
    if (!mapInstance) return
    const videosSource = mapInstance.getSource('videos') as
      | mapboxgl.GeoJSONSource
      | undefined
    if (!videosSource) return
    videosSource.setData({
      type: 'FeatureCollection',
      features: points.map((point) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [point.lng!, point.lat!] },
        properties: { id: point.id },
      })),
    })
  }, [points])

  return (
    <>
      <div ref={mapContainerRef} className="h-dvh w-screen" />
      {focusId && (
        <button
          onClick={() => router.push(`/stories/${focusId}`)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-4 py-2 shadow-lg hover:bg-orange-600 transition"
        >
          View story
        </button>
      )}
    </>
  )
}
