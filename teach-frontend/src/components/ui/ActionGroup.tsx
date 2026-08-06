import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ActionGroupProps {
  children: ReactNode
  className?: string
}

/** Horizontal action row for page headers, dialogs, and wizard footers. */
function ActionGroup({ children, className }: ActionGroupProps) {
  return (
    <div className={cn('teacher-class-detail-actions', className)}>
      {children}
    </div>
  )
}

export default memo(ActionGroup)
