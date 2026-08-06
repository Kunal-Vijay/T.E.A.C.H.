import { memo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type AppPageVariant =
  | 'default'
  | 'student'
  | 'teacher-wide'
  | 'teacher-form'
  | 'teacher-detail'

const PAGE_CLASS: Record<AppPageVariant, string> = {
  default: 'container page-main',
  student: 'container page-main dashboard-home',
  'teacher-wide': 'container page-main teacher-hub-page teacher-hub-page--wide',
  'teacher-form': 'container page-main teacher-hub-page teacher-hub-page--form',
  'teacher-detail': 'container page-main teacher-hub-page teacher-hub-page--detail',
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
