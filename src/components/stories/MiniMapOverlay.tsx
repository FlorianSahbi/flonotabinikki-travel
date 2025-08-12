'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'
import { useRouter } from 'next/navigation'

type Point = Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>

export type MiniMapOverlayRef = {
  flyTo: (lng: number, lat: number) => void
  updatePoints: (points: Point[]) => void
}

type Props = {
  initialPoints: Point[]
  center: [number, number]
}

const MiniMapOverlay = forwardRef<MiniMapOverlayRef, Props>(
  ({ initialPoints, center }, ref) => {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useImperativeHandle(ref, () => ({
      flyTo: (lng: number, lat: number) => {
        const map = mapRef.current
        if (!map) return
        map.flyTo({
          center: [lng, lat],
          zoom: 7.5,
          speed: 1.2,
          essential: true,
        })
      },
      updatePoints: (points: Point[]) => {
        const map = mapRef.current
        const src = map?.getSource('videos') as
          | mapboxgl.GeoJSONSource
          | undefined
        if (src) {
          src.setData({
            type: 'FeatureCollection',
            features: points.map((p) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: { id: p.id },
            })),
          })
        }
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        center,
        zoom: 4.2,
        pitch: 40,
        bearing: -10,
        attributionControl: false,
        interactive: false,
      })
      mapRef.current = map

      map.on('load', () => {
        map.addSource('videos', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: initialPoints.map((p) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: { id: p.id },
            })),
          },
        })

        map.addLayer({
          id: 'videos-points',
          type: 'circle',
          source: 'videos',
          paint: {
            'circle-radius': 6,
            'circle-color': '#FF3B30',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })
      })

      return () => map.remove()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <div
        onClick={() => router.push('/explore')}
        className="absolute right-4 top-4 z-30"
      >
        <div className="relative overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10">
          <div ref={containerRef} className="h-32 w-32" />
        </div>
      </div>
    )
  }
)

MiniMapOverlay.displayName = 'MiniMapOverlay'
export default MiniMapOverlay
