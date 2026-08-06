import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardGridProps {
  children: ReactNode
  loading?: boolean
  className?: string
}

/** Responsive catalog card grid shared by student and teacher hubs. */
function CardGrid({ children, loading = false, className }: CardGridProps) {
  return (
    <div className={cn('class-catalog-grid', loading && 'class-catalog-grid--loading', className)}>
      {children}
    </div>
  )
}

export default memo(CardGrid)
