import { memo, type ElementType, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface AppContainerProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

/** Global horizontal shell — width + padding from design tokens. */
function AppContainer({ as: Tag = 'div', className, children }: AppContainerProps) {
  return <Tag className={cn('app-container', className)}>{children}</Tag>
}

export default memo(AppContainer)
