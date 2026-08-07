import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type AppPageVariant =
  | 'default'
  | 'student'

const PAGE_CLASS: Record<AppPageVariant, string> = {
  default: 'container page-main',
  student: 'container page-main dashboard-home',
}

interface AppPageProps {
  variant?: AppPageVariant
  className?: string
  children: ReactNode
}

/**
 * Standard page `<main>` shell with layout width and hub/student modifiers.
 */
function AppPage({ variant = 'default', className, children }: AppPageProps) {
  return (
    <main className={cn(PAGE_CLASS[variant], className)}>
      {children}
    </main>
  )
}

export default memo(AppPage)
