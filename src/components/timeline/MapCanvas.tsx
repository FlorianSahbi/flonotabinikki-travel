'use client'

import { useCallback, useEffect, useRef } from 'react'

type View = {
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

type LabelPreset = 'default' | 'major-cities-only' | 'none'
type TimeOfDay = 'day' | 'golden' | 'night'

export default function MapCanvas({
  accessToken,
  style = 'mapbox://styles/mapbox/satellite-streets-v12',
  visible,
  view,
  duration = 1200,
  className = '',
  enable3D = true,
  terrainExaggeration = 1.2,
  orbit = false,
  orbitSpeedDeg = 8,
  pauseOrbitDuringTransitions = true,

  labelPreset = 'major-cities-only',
  citySymbolRankMax = 8,
  hideRoads = true,
  hideRoadLabels = true,
  hidePOI = true,
  hideTransit = true,
  hideBoundaries = true,
  hideWaterLabels = true,

  enableFog = true,
  timeOfDay: tod = 'day',
  fogRange = [0.45, 11] as [number, number],
  fogColor = 'rgb(186,210,235)',
  fogHighColor = 'rgb(36,92,223)',
  fogSpaceColor = 'rgb(11,11,25)',
  fogHorizonBlend = 0.24,
  fogStarIntensity = 0,
  skySunIntensity = 15,

  keepBearingOnViewChange = false,
}: {
  accessToken: string
  style?: string
  visible: boolean
  view?: View
  duration?: number
  className?: string
  enable3D?: boolean
  terrainExaggeration?: number
  orbit?: boolean
  orbitSpeedDeg?: number
  pauseOrbitDuringTransitions?: boolean

  labelPreset?: LabelPreset
  citySymbolRankMax?: number
  hideRoads?: boolean
  hideRoadLabels?: boolean
  hidePOI?: boolean
  hideTransit?: boolean
  hideBoundaries?: boolean
  hideWaterLabels?: boolean

  enableFog?: boolean
  timeOfDay?: TimeOfDay
  fogRange?: [number, number]
  fogColor?: string
  fogHighColor?: string
  fogSpaceColor?: string
  fogHorizonBlend?: number
  fogStarIntensity?: number
  skySunIntensity?: number

  keepBearingOnViewChange?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const isFlyingRef = useRef<boolean>(false)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  // orbit helpers (memoized)
  const stopOrbit = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    lastTsRef.current = null
  }, [])

  const startOrbit = useCallback(() => {
    const map = mapRef.current
    if (!map || rafRef.current) return
    const loop = (ts: number) => {
      const last = lastTsRef.current ?? ts
      const dt = (ts - last) / 1000
      lastTsRef.current = ts
      const inc = (orbitSpeedDeg || 0) * dt
      const next = (map.getBearing() + inc) % 360
      map.setBearing(next)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [orbitSpeedDeg])

  const updateOrbit = useCallback(() => {
    const map = mapRef.current
    const shouldOrbit =
      !!map &&
      visible &&
      orbit &&
      !prefersReducedMotion &&
      !(pauseOrbitDuringTransitions && isFlyingRef.current)

    if (shouldOrbit) startOrbit()
    else stopOrbit()
  }, [
    visible,
    orbit,
    pauseOrbitDuringTransitions,
    prefersReducedMotion,
    startOrbit,
    stopOrbit,
  ])

  // memoized style helpers (so eslint deps are happy)
  const applyLabelPreset = useCallback(
    (map: any) => {
      if (!map?.getStyle?.()) return
      const layers: any[] = map.getStyle().layers || []
      const setVis = (id: string, vis: 'none' | 'visible') => {
        try {
          map.setLayoutProperty(id, 'visibility', vis)
        } catch {}
      }
      const hideBy = (regex: RegExp) =>
        layers.forEach((l) => {
          if (regex.test(l.id)) setVis(l.id, 'none')
        })

      const symbolLayers = layers.filter(
        (l) => l.type === 'symbol' && l.layout && l.layout['text-field']
      )

      if (labelPreset === 'none') {
        symbolLayers.forEach((l) => setVis(l.id, 'none'))
        return
      }
      if (hideRoadLabels) hideBy(/road-label/i)
      if (hidePOI) hideBy(/poi-label/i)
      if (hideTransit) hideBy(/transit-label|airport-label/i)
      if (hideBoundaries)
        hideBy(/admin-|country-label|state-label|settlement-subdivision-label/i)
      if (hideWaterLabels) hideBy(/waterway-label|marine-label/i)
      if (hideRoads) hideBy(/^(road-|bridge-|tunnel-)/i)

      if (labelPreset === 'major-cities-only') {
        const candidateIds = symbolLayers
          .map((l) => l.id)
          .filter((id) => /place-label|settlement-label/i.test(id))
        const filterExpr: any = [
          'all',
          ['==', ['get', 'class'], 'city'],
          [
            '<=',
            ['coalesce', ['get', 'symbolrank'], 15],
            Math.max(1, citySymbolRankMax),
          ],
        ]
        symbolLayers.forEach((l: any) => {
          if (candidateIds.includes(l.id)) {
            try {
              setVis(l.id, 'visible')
              map.setFilter(l.id, filterExpr)
            } catch {}
          } else setVis(l.id, 'none')
        })
      }
    },
    [
      labelPreset,
      citySymbolRankMax,
      hideRoads,
      hideRoadLabels,
      hidePOI,
      hideTransit,
      hideBoundaries,
      hideWaterLabels,
    ]
  )

  const applyAtmosphere = useCallback(
    (map: any) => {
      if (!map) return
      let lightColor = '#ffffff'
      let lightIntensity = 0.6
      let star = fogStarIntensity
      if (tod === 'golden') {
        lightColor = '#ffd7a3'
        lightIntensity = 0.7
        star = 0
      }
      if (tod === 'night') {
        lightColor = '#9db4ff'
        lightIntensity = 0.25
        star = Math.max(star, 0.4)
      }
      try {
        map.setLight({
          anchor: 'viewport',
          color: lightColor,
          intensity: lightIntensity,
          position: [1.2, 200, tod === 'day' ? 25 : tod === 'golden' ? 10 : 80],
        } as any)
      } catch {}
      if (!map.getLayer('sky')) {
        try {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun-intensity': skySunIntensity,
            },
          } as any)
        } catch {}
      } else {
        try {
          map.setPaintProperty(
            'sky',
            'sky-atmosphere-sun-intensity',
            skySunIntensity
          )
        } catch {}
      }
      if (enableFog) {
        try {
          map.setFog({
            range: fogRange,
            color: fogColor,
            'high-color': fogHighColor,
            'space-color': fogSpaceColor,
            'horizon-blend': fogHorizonBlend,
            'star-intensity': star,
          } as any)
        } catch {}
      } else {
        try {
          map.setFog(null as any)
        } catch {}
      }
    },
    [
      enableFog,
      tod,
      fogRange,
      fogColor,
      fogHighColor,
      fogSpaceColor,
      fogHorizonBlend,
      fogStarIntensity,
      skySunIntensity,
    ]
  )

  // derived pieces (only for the camera effect)
  const centerLon = view?.center?.[0]
  const centerLat = view?.center?.[1]
  const viewZoom = view?.zoom
  const viewPitch = view?.pitch
  const viewBearing = view?.bearing

  // mount / init
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return
      mapboxgl.default.accessToken = accessToken

      const initialCenter = view?.center ?? [134, 35]
      const initialZoom = view?.zoom ?? 4
      const initialBearing = 0
      const initialPitch = view?.pitch ?? (enable3D ? 45 : 0)

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style,
        center: initialCenter,
        zoom: initialZoom,
        bearing: initialBearing,
        pitch: initialPitch,
        interactive: false,
        attributionControl: false,
        antialias: true,
      })
      mapRef.current = map

      map.on('style.load', () => {
        // atmosphère & labels sont appliqués par l’effet suivant
        if (!enable3D) return
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          } as any)
        }
        map.setTerrain({
          source: 'mapbox-dem',
          exaggeration: terrainExaggeration,
        })

        const layers = map.getStyle().layers || []
        const labelLayerId = layers.find(
          (l: any) => l.type === 'symbol' && l.layout && l.layout['text-field']
        )?.id
        if (!map.getLayer('3d-buildings')) {
          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#d9d9d9',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              },
            } as any,
            labelLayerId
          )
        }
      })

      updateOrbit()
    })()

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [
    accessToken,
    style,
    enable3D,
    terrainExaggeration,
    view?.center,
    view?.zoom,
    view?.pitch,
    updateOrbit,
  ])

  // style-dependent toggles (fog/labels/lighting)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (map.isStyleLoaded?.()) {
      applyAtmosphere(map)
      applyLabelPreset(map)
    } else {
      map.once?.('style.load', () => {
        applyAtmosphere(map)
        applyLabelPreset(map)
      })
    }
  }, [applyAtmosphere, applyLabelPreset])

  // camera transitions on view change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !view) {
      updateOrbit()
      return
    }

    const desiredPitch = viewPitch ?? (enable3D ? 45 : map.getPitch())
    const nextBearing = keepBearingOnViewChange
      ? map.getBearing()
      : (viewBearing ?? 0)

    const dur =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
        ? Math.max(200, Math.round(duration * 0.35))
        : duration

    if (pauseOrbitDuringTransitions) {
      isFlyingRef.current = true
      stopOrbit()
    }

    const onMoveEnd = () => {
      isFlyingRef.current = false
      map.off('moveend', onMoveEnd)
      updateOrbit()
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
    duration,
    enable3D,
    pauseOrbitDuringTransitions,
    keepBearingOnViewChange,
    updateOrbit,
    stopOrbit,
  ])

  // orbit toggles
  useEffect(() => {
    updateOrbit()
  }, [updateOrbit, orbitSpeedDeg])

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
