'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'

type Props = {
  points: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]
}

export default function ExploreMap({ points }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [138.0, 37.0],
      zoom: 4.2,
      pitch: 40,
      bearing: -10,
      attributionControl: false,
    })

    map.on('load', () => {
      map.addSource('videos', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points.map((p) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.lng!, p.lat!],
            },
            properties: {
              id: p.id,
            },
          })),
        },
      })

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
    })

    return () => map.remove()
  }, [points])

  return <div ref={ref} className="h-dvh w-screen" />
}
