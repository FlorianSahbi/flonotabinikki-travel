'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Tables } from '@/types/supabase'

type Props = {
  initialPoints: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]
  center: [number, number]
  onClick?: () => void // ✅ on ajoute la prop optionnelle
}

export type MiniMapOverlayRef = {
  flyTo: (lng: number, lat: number) => void
  updatePoints: (points: Pick<Tables<'videos'>, 'id' | 'lat' | 'lng'>[]) => void
}

const MiniMapOverlay = forwardRef<MiniMapOverlayRef, Props>(
  ({ initialPoints, center, onClick }, ref) => {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Charger paramètres sauvegardés
    const savedState = (() => {
      try {
        const s = localStorage.getItem('exploreMapState')
        return s ? JSON.parse(s) : {}
      } catch {
        return {}
      }
    })()

    const startZoom =
      typeof savedState.zoom === 'number' ? savedState.zoom : 4.2
    const startPitch =
      typeof savedState.pitch === 'number' ? savedState.pitch : 40

    useImperativeHandle(ref, () => ({
      flyTo: (lng: number, lat: number) => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: startZoom, // conserve le zoom sauvegardé
            pitch: startPitch, // conserve le pitch sauvegardé
            speed: 1.2,
            essential: true,
          })
        }
      },
      updatePoints: (points) => {
        if (!mapRef.current) return
        const src = mapRef.current.getSource('videos') as
          | mapboxgl.GeoJSONSource
          | undefined
        if (src) {
          src.setData({
            type: 'FeatureCollection',
            features: points.map((p) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [p.lng!, p.lat!],
              },
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
        zoom: startZoom,
        pitch: startPitch,
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
              geometry: {
                type: 'Point',
                coordinates: [p.lng!, p.lat!],
              },
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
            'circle-color': '#FF5722',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })
      })

      return () => map.remove()
    }, [center, startZoom, startPitch])

    return (
      <div
        onClick={onClick}
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
