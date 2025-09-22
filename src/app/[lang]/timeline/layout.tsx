'use client'

import {
  AudioProvider,
  //  useAudioCtx
} from '@/app/context/audio/context'
import { MapProvider } from '@/app/context/map/context'
import {
  TimelineProvider,
  useTimelineCtx,
} from '@/app/context/timeline/context'
import { MapCanvas } from '@/components/timeline'
import PageTransition from '@/components/ui/PageTransition'
// import HeadlessSyncTracks from '@/components/audio/HeadlessSyncTracks'
// import { VolumeX, Volume1, Volume2 } from 'lucide-react'

// function VolumeFab() {
//   const audio = useAudioCtx()
//   const Icon =
//     audio.volumeLevel === 0
//       ? VolumeX
//       : audio.volumeLevel === 1
//         ? Volume1
//         : Volume2
//   return (
//     <button
//       type="button"
//       onClick={audio.cycleVolume}
//       aria-label="Volume"
//       className="fixed z-50 right-4 bottom-4 md:top-4 md:bottom-auto rounded-full border border-white/20 bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/16 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
//     >
//       <Icon className="h-5 w-5" />
//     </button>
//   )
// }

function Wrapper({ children }: { children: React.ReactNode }) {
  const { isMapReady } = useTimelineCtx()
  // const audio = useAudioCtx()

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
        {/* <HeadlessSyncTracks
          tracks={audio.tracks}
          activeIndex={audio.activeIndex}
          playing={audio.playing}
          fadeMs={450}
          masterGain={audio.masterGain}
        /> */}

        <MapCanvas
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
          visible
        />

        {/* <VolumeFab /> */}

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
