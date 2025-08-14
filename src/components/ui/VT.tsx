import React from 'react'
import clsx from 'clsx'

type SharedProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof JSX.IntrinsicElements
  name: string // ex: `cluster-${id}`
}

export function VTShared({
  as = 'div',
  name,
  className,
  style,
  ...rest
}: SharedProps) {
  const Comp: any = as
  return (
    <Comp
      className={clsx('vt-shared', className)}
      style={{ ...(style || {}), ['--vt-name' as any]: name }}
      {...rest}
    />
  )
}
