// src/components/timeline/TitleHero.tsx
'use client'

type Props = {
  title: string
  subtitle?: string
  heightVh?: number
  className?: string
  titleClassName?: string
  subtitleClassName?: string
  uppercase?: boolean
}

export default function TitleHero({
  title,
  subtitle,
  heightVh = 300,
  className = '',
  titleClassName = 'text-[12vw] leading-none font-extrabold tracking-tight text-white/90',
  subtitleClassName = 'text-[4vw] text-white/70 -mt-2',
  uppercase = true,
}: Props) {
  return (
    <section
      className={`relative ${className}`}
      style={{ height: `${heightVh}vh` }}
      aria-label="Title section"
    >
      <div className="sticky top-0 h-screen grid place-items-center">
        <div className="text-center select-none">
          <div className={titleClassName}>
            {uppercase ? title.toUpperCase() : title}
          </div>
          {subtitle ? (
            <div className={subtitleClassName}>{subtitle}</div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
