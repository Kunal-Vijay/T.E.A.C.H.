import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import Icon from './Icon'

export type EmptyStateTone = 'loading' | 'empty' | 'success' | 'error' | 'missing'

interface EmptyStateProps {
  tone: EmptyStateTone
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

const TONE_CLASS: Record<EmptyStateTone, string> = {
  loading: 'empty-state-loading',
  empty: 'empty-state-empty',
  success: 'empty-state-success',
  error: 'empty-state-error',
  missing: 'empty-state-error',
}

export default function EmptyState({
  tone,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${TONE_CLASS[tone]}${compact ? ' empty-state-compact' : ''}`}
      role="status"
    >
      <div className="empty-state-mark" aria-hidden="true">
        {tone === 'loading' ? (
          <Icon icon={Loader2} size={compact ? 18 : 20} className="empty-state-spinner" />
        ) : tone === 'success' ? (
          <Icon icon={CheckCircle2} size={compact ? 18 : 20} />
        ) : tone === 'error' || tone === 'missing' ? (
          <Icon icon={AlertCircle} size={compact ? 18 : 20} />
        ) : (
          <Icon icon={Inbox} size={compact ? 18 : 20} />
        )}
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        {description != null && description !== '' ? <p>{description}</p> : null}
        {action != null ? <div className="empty-state-action">{action}</div> : null}
      </div>
    </div>
  )
}
