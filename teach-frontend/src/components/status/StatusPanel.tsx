import type { ReactNode } from 'react'
import EmptyState, { type EmptyStateTone } from '../ui/EmptyState'

type StatusTone = 'loading' | 'empty' | 'success' | 'missing'

interface StatusPanelProps {
  tone: StatusTone
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

const TONE_MAP: Record<StatusTone, EmptyStateTone> = {
  loading: 'loading',
  empty: 'empty',
  success: 'success',
  missing: 'error',
}

export default function StatusPanel(props: StatusPanelProps) {
  return <EmptyState {...props} tone={TONE_MAP[props.tone]} />
}
