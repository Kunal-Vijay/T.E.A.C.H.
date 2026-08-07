import { memo } from 'react'
import { cn } from '../../lib/cn'
import type { PlanStatus } from '../../types/api.types'

export type HubBadgeStatus = PlanStatus | 'ready'

const HUB_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

interface StatusBadgeProps {
  /** Hub plan status badges or catalog "ready to join" pill */
  variant: 'hub' | 'catalog'
  status?: HubBadgeStatus
  label?: string
  className?: string
}

function resolveLabel(variant: StatusBadgeProps['variant'], status: HubBadgeStatus | undefined, label?: string): string {
  if (label != null && label !== '') {
    return label
  }
  if (variant === 'catalog') {
    return 'Ready to join'
  }
  if (status === 'ready') {
    return 'Ready'
  }
  if (status != null && status in HUB_STATUS_LABEL) {
    return HUB_STATUS_LABEL[status as PlanStatus]
  }
  return ''
}

function StatusBadge({ variant, status, label, className }: StatusBadgeProps) {
  const resolvedLabel = resolveLabel(variant, status, label)
  const showDot =
    variant === 'catalog'
    || status === 'published'
    || status === 'ready'

  if (variant === 'catalog') {
    return (
      <span className={cn('class-catalog-badge', className)}>
        {showDot ? <span className="class-catalog-badge-dot" aria-hidden="true" /> : null}
        {resolvedLabel}
      </span>
    )
  }

  const hubStatus = status ?? 'draft'

  return (
    <span className={cn('hub-status-badge', `hub-status-badge--${hubStatus}`, className)}>
      {showDot ? <span className="hub-status-badge-dot" aria-hidden="true" /> : null}
      {resolvedLabel}
    </span>
  )
}

export default memo(StatusBadge)
