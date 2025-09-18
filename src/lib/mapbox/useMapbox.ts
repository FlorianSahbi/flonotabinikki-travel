// src/lib/mapbox/useMapbox.ts
'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { normalizeCamera, type View } from './utils'

export type MapAPI = {
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

type UseMapboxProps = {
  accessToken: string
  style?: string
  initialView?: View
  interactive?: boolean
  onReady?: () => void
}

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ||
  'mapbox://styles/mapbox/satellite-v9'

const DEFAULT_VIEW: Required<View> = {
  center: [134, 35],
  zoom: 4,
  pitch: 25,
  bearing: 0,
}
const DEFAULT_DURATION = 1200

export function useMapbox({
  accessToken,
  style = DEFAULT_STYLE,
  initialView = DEFAULT_VIEW,
  interactive = false,
  onReady,
}: UseMapboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const readyResolveRef = useRef<() => void>(() => {})
  const readyPromise = useMemo(
    () =>
      new Promise<void>((resolve) => {
        readyResolveRef.current = resolve
      }),
    []
  )
  const hasReadyFiredRef = useRef(false)

  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return

      mapboxgl.default.accessToken = accessToken

      const iv = {
        ...DEFAULT_VIEW,
        ...initialView,
        zoom: initialView.zoom ?? DEFAULT_VIEW.zoom,
        pitch: initialView.pitch ?? DEFAULT_VIEW.pitch,
        bearing: initialView.bearing ?? DEFAULT_VIEW.bearing,
        center: initialView.center ?? DEFAULT_VIEW.center,
      }

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style,
        center: iv.center,
        zoom: iv.zoom,
        bearing: iv.bearing,
        pitch: iv.pitch,
        interactive,
        attributionControl: false,
        antialias: false,
      })
      mapRef.current = map

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

      map.on('load', () => {
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
  }, [accessToken, style, initialView, interactive, onReady])

  type MoveMethod = 'flyTo' | 'easeTo' | 'jumpTo'

  const api: MapAPI = useMemo(() => {
    const createMove =
      (method: MoveMethod) =>
      (
        v: View,
        opts?: { duration?: number; keepBearingOnViewChange?: boolean }
      ) => {
        const map = mapRef.current
        if (!map) return
        const cam = normalizeCamera(map, v, opts?.keepBearingOnViewChange)

        // jumpTo is instant (no duration/essential), unlike animated flyTo/easeTo—handle separately.
        if (method === 'jumpTo') {
          map.jumpTo(cam)
          return
        }

        // inline reduced-motion handling (no separate helper)
        const base = opts?.duration ?? DEFAULT_DURATION
        const duration = reduceMotion
          ? Math.max(200, Math.round(base * 0.35))
          : base

        const payload = { ...cam, duration, essential: true }
        ;(map as any)[method](payload)
      }

    return {
      flyTo: createMove('flyTo'),
      easeTo: createMove('easeTo'),
      jumpTo: createMove('jumpTo'),
      getMap: () => mapRef.current,
      ready: () => readyPromise,
    }
  }, [reduceMotion, readyPromise])

  return { containerRef, api }
}

export type { View }
