// @path: src/app/[lang]/timeline/layout.tsx
'use client'

import { AudioProvider } from '@/shared/context/audio/context'
import { MapProvider } from '@/shared/map/context/MapContext'
import { TimelineProvider, useTimelineCtx } from '@/features/timeline/context'
import MapCanvas from '@/shared/map/components/MapCanvas'
import PageTransition from '@/shared/ui/PageTransition'

function Wrapper({ children }: { children: React.ReactNode }) {
  const { isMapReady } = useTimelineCtx()

  return (
    <>
      {!isMapReady && (
        <div className="fixed inset-0 z-[9999]">
          <PageTransition
            isVisible
            title="JAPAN ’24"
            subtitle="Preparing the map…"
          />
        </div>
      )}

      <div
        className={`transition-opacity duration-500 ${
          isMapReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMapReady}
      >
        <MapCanvas
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
          visible
        />
        {children}
      </div>
    </>
  )
}

type AnyLayoutProps = { children: React.ReactNode } & Record<string, unknown>

export default function TimelineLayout({ children }: AnyLayoutProps) {
  return (
    <AudioProvider>
      <MapProvider>
        <TimelineProvider>
          <Wrapper>{children}</Wrapper>
        </TimelineProvider>
      </MapProvider>
    </AudioProvider>
  )
}
