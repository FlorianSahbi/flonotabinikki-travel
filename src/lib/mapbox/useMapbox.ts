// src/lib/mapbox/useMapbox.ts
'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { normalizeCamera, type View } from './utils'
import type { CameraFns, MoveOpts } from '@/types/app'

/**
 * Ultra-lean Mapbox hook
 * - Only instantiates the map and exposes camera helpers.
 * - No external "ready" contract here; lifecycle is handled by MapContext + MapCanvas.
 * - Visual style & initial state are owned by Mapbox Studio.
 */

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ||
  'mapbox://styles/mapbox/satellite-v9'

// Safe defaults (Studio usually overrides these)
const DEFAULT_VIEW: Required<View> = {
  center: [134, 35],
  zoom: 4,
  pitch: 25,
  bearing: 0,
}

const DEFAULT_DURATION = 1200

type UseMapboxProps = {
  accessToken: string
}

export function useMapbox({ accessToken }: UseMapboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return

      if (!accessToken || !accessToken.trim()) {
        // Hard fail in dev to avoid silent misconfigurations
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            '[useMapbox] Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN.'
          )
        }
        return
      }

      mapboxgl.default.accessToken = accessToken

      // Studio can override; we still provide sane defaults
      const iv = DEFAULT_VIEW

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: DEFAULT_STYLE,
        center: iv.center,
        zoom: iv.zoom,
        bearing: iv.bearing,
        pitch: iv.pitch,
        interactive: false, // camera controlled by the app
        attributionControl: false,
        antialias: false,
      })
      mapRef.current = map

      map.on('error', (e: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useMapbox] map error:', e?.error || e)
        }
      })
    })()

    return () => {
      mounted = false
      if (mapRef.current) {
        // Let remove() throw in dev if something is wrong with teardown
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [accessToken])

  // Factory for movement methods (flyTo/easeTo/jumpTo) with reduced-motion awareness
  const createMove =
    <K extends 'flyTo' | 'easeTo' | 'jumpTo'>(method: K) =>
    (v: View, opts?: MoveOpts) => {
      const map = mapRef.current
      if (!map) return

      const cam = normalizeCamera(map, v, opts?.keepBearingOnViewChange)

      if (method === 'jumpTo') {
        map.jumpTo(cam)
        return
      }

      const base = opts?.duration ?? DEFAULT_DURATION
      const duration = reduceMotion
        ? Math.max(200, Math.round(base * 0.35))
        : base

      const payload = { ...cam, duration, essential: true }
      ;(map as any)[method](payload)
    }

  // Re-use shared CameraFns surface + add a lightweight getter (no new global type)
  const api = useMemo<CameraFns & { getMap: () => any | null }>(
    () => ({
      flyTo: createMove('flyTo'),
      easeTo: createMove('easeTo'),
      jumpTo: createMove('jumpTo'),
      getMap: () => mapRef.current,
    }),
    [reduceMotion]
  )

  return { containerRef, api }
}

// Re-export for convenience; source of truth remains in ./utils and @/types/app
export type { View }
