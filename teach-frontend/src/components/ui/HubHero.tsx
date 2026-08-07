import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface HubHeroProps {
  children: ReactNode
  className?: string
}

/** Dashboard hero band — page header + optional stats/onboarding content. */
function HubHero({ children, className }: HubHeroProps) {
  return <div className={cn('dashboard-hero', className)}>{children}</div>
}

export default memo(HubHero)
