// src/components/timeline/MapCanvas.tsx
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useReducedMotion } from 'framer-motion'

type View = {
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

export type MapCanvasHandle = {
  flyTo: (
    v: View,
    opts?: { duration?: number; keepBearingOnViewChange?: boolean }
  ) => void
  easeTo: (
    v: View,
    opts?: { duration?: number; keepBearingOnViewChange?: boolean }
  ) => void
  jumpTo: (v: View, opts?: { keepBearingOnViewChange?: boolean }) => void
  getMap: () => any | null
  ready: () => Promise<void>
}

const TERRAIN_EXAGGERATION = 1.2
const SKY_SUN_INTENSITY = 15

const INITIAL_CENTER: [number, number] = [134, 35]
const INITIAL_ZOOM = 4
const INITIAL_PITCH = 25
const INITIAL_BEARING = 0
const DEFAULT_DURATION = 1200

function applyAtmosphere(map: any) {
  if (!map) return
  try {
    map.setLight({
      anchor: 'viewport',
      color: '#ffffff',
      intensity: 0.6,
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
      'star-intensity': 0,
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
    if (l.type === 'symbol') return setVis(id, 'none')
    if (/^(road-|bridge-|tunnel-)/i.test(id)) return setVis(id, 'none')
    if (/^admin-/i.test(id)) return setVis(id, 'none')
  })
}

function normalizeCamera(map: any, v: View, keepBearing?: boolean) {
  const desiredPitch = v.pitch ?? INITIAL_PITCH
  const desiredBearing = keepBearing
    ? map.getBearing()
    : (v.bearing ?? INITIAL_BEARING)
  return {
    center: v.center,
    zoom: v.zoom ?? map.getZoom(),
    pitch: desiredPitch,
    bearing: desiredBearing,
  }
}

type Props = {
  accessToken: string
  style?: string
  visible: boolean
  className?: string
  onReady?: () => void
}

const MapCanvas = forwardRef<MapCanvasHandle, Props>(function MapCanvas(
  {
    accessToken,
    style = 'mapbox://styles/mapbox/satellite-streets-v12',
    visible,
    className = '',
    onReady,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const readyResolveRef = useRef<() => void>(() => {})
  const readyPromiseRef = useRef<Promise<void>>(
    new Promise<void>((resolve) => {
      readyResolveRef.current = resolve
    })
  )
  const hasReadyFiredRef = useRef(false)

  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return
      mapboxgl.default.accessToken = accessToken

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        bearing: INITIAL_BEARING,
        pitch: INITIAL_PITCH,
        interactive: false,
        attributionControl: false,
        antialias: false,
      })
      mapRef.current = map

      map.on('load', () => {
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

        applyAtmosphere(map)
        applyLabelTrim(map)

        try {
          map.triggerRepaint()
        } catch {}

        const fireReadyOnce = () => {
          if (hasReadyFiredRef.current) return
          hasReadyFiredRef.current = true
          try {
            onReady?.()
          } catch {}
          try {
            readyResolveRef.current?.()
          } catch {}
        }

        map.once('idle', fireReadyOnce)

        setTimeout(fireReadyOnce, 2500)
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
  }, [accessToken, style, onReady])

  useImperativeHandle(
    ref,
    (): MapCanvasHandle => ({
      flyTo: (v, opts) => {
        const map = mapRef.current
        if (!map) return
        const cam = normalizeCamera(map, v, opts?.keepBearingOnViewChange)
        const dur = reduceMotion
          ? Math.max(
              200,
              Math.round((opts?.duration ?? DEFAULT_DURATION) * 0.35)
            )
          : (opts?.duration ?? DEFAULT_DURATION)
        map.flyTo({ ...cam, duration: dur, essential: true })
      },
      easeTo: (v, opts) => {
        const map = mapRef.current
        if (!map) return
        const cam = normalizeCamera(map, v, opts?.keepBearingOnViewChange)
        const dur = reduceMotion
          ? Math.max(
              200,
              Math.round((opts?.duration ?? DEFAULT_DURATION) * 0.35)
            )
          : (opts?.duration ?? DEFAULT_DURATION)
        map.easeTo({ ...cam, duration: dur, essential: true })
      },
      jumpTo: (v, opts) => {
        const map = mapRef.current
        if (!map) return
        const cam = normalizeCamera(map, v, opts?.keepBearingOnViewChange)
        map.jumpTo(cam)
      },
      getMap: () => mapRef.current,
      ready: () => readyPromiseRef.current,
    }),
    [reduceMotion]
  )

  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none transition-opacity duration-500 ${className}`}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
})

export default MapCanvas
