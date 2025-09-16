// src/components/timeline/TrackerDot.tsx

type TrackerDotProps = {
  visible: boolean
  size: number
  left?: string | number
}

export function TrackerDot({ visible, size }: TrackerDotProps) {
  return (
    <div
      className="fixed z-10 pointer-events-none"
      style={{
        top: '50vh',
        width: size,
        height: size,
        borderRadius: 9999,
        background: 'white',
        boxShadow: '0 0 0 4px rgba(255,255,255,0.35)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
      aria-hidden
    />
  )
}
