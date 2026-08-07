import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SectionTitleProps {
  children: ReactNode
  as?: 'h2' | 'h3'
  className?: string
  id?: string
}

/**
 * Section heading within hub pages and panels.
 * Uses teacher detail title styling by default; pass `className` to override.
 */
function SectionTitle({ children, as: Tag = 'h2', className, id }: SectionTitleProps) {
  return (
    <Tag id={id} className={cn('teacher-class-detail-section-title', className)}>
      {children}
    </Tag>
  )
}

export default memo(SectionTitle)
