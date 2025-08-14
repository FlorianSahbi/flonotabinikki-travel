import type React from 'react'

/**
 * VT: petit wrapper utilitaire pour appliquer un viewTransitionName typé,
 * sans recourir à "any". Utilisation:
 *
 * <VT name={`cluster-${id}`} className="..." style={{ ... }}>
 *   ...children...
 * </VT>
 */
export type VTProps<T extends React.ElementType = 'div'> = {
  name?: string
  as?: T
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  'as' | 'style' | 'className' | 'children'
>

export default function VT<T extends React.ElementType = 'div'>({
  name,
  as,
  className,
  style,
  children,
  ...rest
}: VTProps<T>) {
  const Tag = (as || 'div') as React.ElementType

  const styleWithVT: React.CSSProperties = { ...(style || {}) }
  if (name) {
    ;(styleWithVT as Record<string, unknown>)['viewTransitionName'] = name
  }

  return (
    <Tag className={className} style={styleWithVT} {...(rest as object)}>
      {children}
    </Tag>
  )
}
