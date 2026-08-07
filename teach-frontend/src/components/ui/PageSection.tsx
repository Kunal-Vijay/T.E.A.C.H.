import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageSectionProps {
  label: string
  children: ReactNode
  className?: string
  /** Adds `catalog-section` modifier used on the student catalog page */
  catalog?: boolean
}

function PageSection({ label, children, className, catalog = false }: PageSectionProps) {
  return (
    <section
      className={cn(catalog && 'catalog-section', 'dashboard-catalog', className)}
      aria-label={label}
    >
      {children}
    </section>
  )
}

export default memo(PageSection)
