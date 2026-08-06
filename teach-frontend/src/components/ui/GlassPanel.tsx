import { createElement, memo, type FormHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type GlassPanelElement = 'section' | 'div' | 'form' | 'article'

type GlassPanelProps = {
  as?: GlassPanelElement
  children: ReactNode
  className?: string
} & (
  | ({ as?: 'section' | 'div' | 'article' } & HTMLAttributes<HTMLElement>)
  | ({ as: 'form' } & FormHTMLAttributes<HTMLFormElement>)
)

/**
 * Frosted hub surface wrapper. Applies `.hub-glass-panel` from the design system.
 */
function GlassPanel({ as = 'section', className, children, ...rest }: GlassPanelProps) {
  return createElement(
    as,
    {
      className: cn('hub-glass-panel', className),
      ...rest,
    },
    children,
  )
}

export default memo(GlassPanel)
