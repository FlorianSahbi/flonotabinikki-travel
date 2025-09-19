// src/lib/mapbox/utils.ts
export type View = {
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

export function normalizeCamera(map: any, v: View, keepBearing?: boolean) {
  const pitch = v.pitch ?? map.getPitch?.() ?? 0
  const bearing = keepBearing
    ? (map.getBearing?.() ?? 0)
    : (v.bearing ?? map.getBearing?.() ?? 0)
  const zoom = v.zoom ?? map.getZoom?.() ?? 0
  return { center: v.center, zoom, pitch, bearing }
}
