'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

type View = {
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

const TERRAIN_EXAGGERATION = 1.2
const SKY_SUN_INTENSITY = 15

// Photorealistic atmosphere (fixed: day)
function applyAtmosphere(map: any) {
  if (!map) return
  const lightColor = '#ffffff'
  const lightIntensity = 0.6
  const starIntensity = 0 // day

  try {
    map.setLight({
      anchor: 'viewport',
      color: lightColor,
      intensity: lightIntensity,
      position: [1.2, 200, 25],
    } as any)
  } catch {}

  if (!map.getLayer('sky')) {
    try {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun-intensity': SKY_SUN_INTENSITY,
        },
      } as any)
    } catch {}
  } else {
    try {
      map.setPaintProperty(
        'sky',
        'sky-atmosphere-sun-intensity',
        SKY_SUN_INTENSITY
      )
    } catch {}
  }

  try {
    map.setFog({
      range: [0.45, 11],
      color: 'rgb(186,210,235)',
      'high-color': 'rgb(36,92,223)',
      'space-color': 'rgb(11,11,25)',
      'horizon-blend': 0.24,
      'star-intensity': starIntensity,
    } as any)
  } catch {}
}

function applyLabelTrim(map: any) {
  if (!map?.getStyle?.()) return
  const layers: any[] = map.getStyle().layers || []

  const setVis = (id: string, vis: 'none' | 'visible') => {
    try {
      map.setLayoutProperty(id, 'visibility', vis)
    } catch {}
  }

  layers.forEach((l) => {
    const id = l.id as string
    if (l.type === 'symbol') {
      setVis(id, 'none')
      return
    }
    if (/^(road-|bridge-|tunnel-)/i.test(id)) {
      setVis(id, 'none')
      return
    }
    if (/^admin-/i.test(id)) {
      setVis(id, 'none')
      return
    }
  })
}

export default function MapCanvas({
  accessToken,
  style = 'mapbox://styles/mapbox/satellite-streets-v12',
  visible,
  view,
  duration = 1200,
  className = '',
  keepBearingOnViewChange = false,
}: {
  accessToken: string
  style?: string
  visible: boolean
  view?: View
  duration?: number
  className?: string
  keepBearingOnViewChange?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const initialCenterRef = useRef<[number, number]>(view?.center ?? [134, 35])
  const initialZoomRef = useRef<number>(view?.zoom ?? 4)
  const initialPitchRef = useRef<number>(view?.pitch ?? 45)

  const reduceMotion = useReducedMotion()

  const centerLon = view?.center?.[0]
  const centerLat = view?.center?.[1]
  const viewZoom = view?.zoom
  const viewPitch = view?.pitch
  const viewBearing = view?.bearing

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return
      mapboxgl.default.accessToken = accessToken

      const initialCenter = initialCenterRef.current
      const initialZoom = initialZoomRef.current
      const initialBearing = 0
      const initialPitch = initialPitchRef.current

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style,
        center: initialCenter,
        zoom: initialZoom,
        bearing: initialBearing,
        pitch: initialPitch,
        interactive: false,
        attributionControl: false,
        antialias: false, // ✅ moins de coût GPU (on n'a plus d'extrusions 3D)
      })
      mapRef.current = map

      // ✅ appliquer terrain/atm/trim après le chargement complet du style
      map.on('load', () => {
        // Terrain 3D (exagération fixe)
        if (!map.getSource('mapbox-dem')) {
          try {
            map.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14,
            } as any)
          } catch {}
        }
        try {
          map.setTerrain({
            source: 'mapbox-dem',
            exaggeration: TERRAIN_EXAGGERATION,
          })
        } catch {}

        // Atmosphère + trim des couches
        applyAtmosphere(map)
        applyLabelTrim(map)
      })
    })()

    return () => {
      mounted = false
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {}
        mapRef.current = null
      }
    }
  }, [accessToken, style])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !view) return

    const desiredPitch = viewPitch ?? 45
    const nextBearing = keepBearingOnViewChange
      ? map.getBearing()
      : (viewBearing ?? 0)

    const dur = reduceMotion
      ? Math.max(200, Math.round((duration ?? 1200) * 0.35))
      : (duration ?? 1200)

    const onMoveEnd = () => {
      map.off('moveend', onMoveEnd)
    }
    map.on('moveend', onMoveEnd)

    map.flyTo({
      center: [
        centerLon ?? map.getCenter().lng,
        centerLat ?? map.getCenter().lat,
      ],
      zoom: viewZoom ?? map.getZoom(),
      pitch: desiredPitch,
      bearing: nextBearing,
      duration: dur,
      essential: true,
    })

    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [
    view,
    centerLon,
    centerLat,
    viewZoom,
    viewPitch,
    viewBearing,
    keepBearingOnViewChange,
    duration,
    reduceMotion,
  ])

  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none transition-opacity duration-500 ${className}`}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}
