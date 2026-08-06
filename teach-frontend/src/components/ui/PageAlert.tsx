import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageAlertProps {
  children: ReactNode
  className?: string
}

/** Top-of-page alert slot — wraps ErrorState and confirmation banners. */
function PageAlert({ children, className }: PageAlertProps) {
  return <div className={cn('dashboard-alert', className)}>{children}</div>
}

export default memo(PageAlert)
