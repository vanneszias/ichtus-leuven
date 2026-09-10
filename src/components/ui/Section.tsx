import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type Theme = 'white' | 'blue' | 'yellow' | 'pink' | 'green'
type Width = 'narrow' | 'standard' | 'wide'

export function Container({
  children,
  className = '',
  width = 'standard',
}: {
  children: ReactNode
  className?: string
  width?: Width | null
}) {
  return (
    <div className={`container container--${width || 'standard'} ${className}`.trim()}>
      {children}
    </div>
  )
}

type SectionProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
  id?: string
  spacing?: 'compact' | 'normal' | 'spacious' | null
  theme?: Theme | null
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'id'>

export function Section<T extends ElementType = 'section'>({
  as,
  children,
  className = '',
  id,
  spacing = 'normal',
  theme = 'white',
  ...props
}: SectionProps<T>) {
  const Tag = as || 'section'
  return (
    <Tag
      className={`section section--${theme || 'white'} section--${spacing || 'normal'} ${className}`.trim()}
      id={id}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function SectionHeader({ heading, intro }: { heading: string; intro?: string | null }) {
  return (
    <div className="section-header">
      <h2>{heading}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </div>
  )
}
