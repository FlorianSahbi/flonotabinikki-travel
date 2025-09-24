// @path: src/shared/map/hooks/useMapbox.ts
'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { CameraFns, MoveOpts } from '@/shared/types/app'
import { View, normalizeCamera } from '../utils/utils'

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ||
  'mapbox://styles/florian-sahbi/cmfoug58000dk01sbcfzs78dw'

const DEFAULT_VIEW: Required<View> = {
  center: [134, 35],
  zoom: 4,
  pitch: 25,
  bearing: 0,
}
const DEFAULT_DURATION = 1200

type UseMapboxProps = { accessToken: string; interactive?: boolean }

export function useMapbox({ accessToken, interactive }: UseMapboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mapboxgl = await import('mapbox-gl')
      if (!mounted || !containerRef.current) return

      if (!accessToken || !accessToken.trim()) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            '[useMapbox] Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN.'
          )
        }
        return
      }

      mapboxgl.default.accessToken = accessToken
      const iv = DEFAULT_VIEW

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: DEFAULT_STYLE,
        center: iv.center,
        zoom: iv.zoom,
        bearing: iv.bearing,
        pitch: iv.pitch,
        attributionControl: false,
        antialias: false,
        interactive: interactive ?? false,
      })
      mapRef.current = map

      const kickResizes = () => {
        try {
          map.resize()
          requestAnimationFrame(() => {
            try {
              map.resize()
              setTimeout(() => {
                try {
                  map.resize()
                } catch {}
              }, 0)
            } catch {}
          })
        } catch {}
      }

      map.on('load', kickResizes)
      map.on('styledata', () => {
        try {
          map.resize()
        } catch {}
      })
      map.on('idle', () => {
        try {
          map.resize()
        } catch {}
      })

      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        const ro = new ResizeObserver(() => {
          const m = mapRef.current
          if (!m) return
          try {
            m.resize()
          } catch {}
        })
        ro.observe(containerRef.current)
        resizeObserverRef.current = ro
      }

      map.on('error', (e: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useMapbox] map error:', e?.error || e)
        }
      })

      requestAnimationFrame(() => {
        const m = mapRef.current
        if (!m) return
        try {
          m.resize()
        } catch {}
      })
    })()

    return () => {
      mounted = false
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect()
        } catch {}
        resizeObserverRef.current = null
      }
      const map = mapRef.current
      if (map) {
        try {
          map.remove()
        } finally {
          mapRef.current = null
        }
      }
    }
  }, [accessToken, interactive])

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

  const api = useMemo<CameraFns & { getMap: () => any | null }>(
    () => ({
      flyTo: createMove('flyTo'),
      easeTo: createMove('easeTo'),
      jumpTo: createMove('jumpTo'),
      getMap: () => mapRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduceMotion]
  )

  return { containerRef, api }
}

export type { View }
