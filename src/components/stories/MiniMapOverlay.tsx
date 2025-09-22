// src/components/stories/MiniMapOverlay.tsx
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'

type Props = {
  initialPoints: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]
  center: [number, number]
  onClick?: () => void
}

export type MiniMapOverlayRef = {
  flyTo: (lng: number, lat: number) => void
  updatePoints: (points: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]) => void
  setActive: (id: string | null) => void
}

const ORANGE = '#FF5722'
const BLUE = '#3B82F6'

const MiniMapOverlay = forwardRef<MiniMapOverlayRef, Props>(
  ({ initialPoints, center, onClick }, ref) => {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const initialCenterRef = useRef(center)
    const initialPointsRef = useRef(initialPoints)

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const tokenMissing = !token

    useImperativeHandle(ref, () => ({
      flyTo: (lng: number, lat: number) => {
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 7.5,
          speed: 1.2,
          essential: true,
        })
      },
      updatePoints: (points) => {
        const src = mapRef.current?.getSource('videos') as
          | mapboxgl.GeoJSONSource
          | undefined
        if (src) {
          src.setData({
            type: 'FeatureCollection',
            features: points.map((p) => ({
              type: 'Feature',
              id: p.id,
              geometry: { type: 'Point', coordinates: [p.lng!, p.lat!] },
              properties: { id: p.id },
            })),
          })
        }
      },
      setActive: (id: string | null) => {
        const map = mapRef.current
        if (!map) return
        const expr: any = [
          'case',
          ['==', ['get', 'id'], id ?? '__none__'],
          BLUE,
          ORANGE,
        ]
        try {
          map.setPaintProperty('videos-points', 'circle-color', expr)
        } catch {}
      },
    }))

    useEffect(() => {
      if (!containerRef.current || tokenMissing) return

      mapboxgl.accessToken = token!

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenterRef.current,
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
            features: initialPointsRef.current.map((p) => ({
              type: 'Feature',
              id: p.id,
              geometry: { type: 'Point', coordinates: [p.lng!, p.lat!] },
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
            'circle-color': ORANGE,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })
      })

      return () => map.remove()
    }, [tokenMissing, token])

    if (tokenMissing) {
      return (
        <div className="absolute right-4 top-4 z-30 cursor-default" aria-hidden>
          <div className="h-32 w-32 grid place-items-center rounded-xl shadow-lg ring-1 ring-black/10 bg-neutral-900 text-neutral-400 text-xs">
            Minimap indisponible
          </div>
        </div>
      )
    }

    return (
      <div
        onClick={onClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
        role="button"
        tabIndex={0}
        className="absolute right-4 top-4 z-30 cursor-pointer"
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
