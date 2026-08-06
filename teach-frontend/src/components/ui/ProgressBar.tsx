import { memo } from 'react'
import { cn } from '../../lib/cn'

export type ProgressBarVariant = 'goal' | 'journey'

interface ProgressBarProps {
  value: number
  variant?: ProgressBarVariant
  milestone?: boolean
  className?: string
  'aria-label'?: string
  'aria-valuetext'?: string
}

const BAR_CLASS: Record<ProgressBarVariant, { track: string; fill: string }> = {
  goal: { track: 'daily-goal-bar', fill: 'daily-goal-fill' },
  journey: { track: 'journey-progress-bar', fill: 'journey-progress-fill' },
}

/**
 * Token-backed progress track. Pair with a label in the parent when needed.
 */
function ProgressBar({
  value,
  variant = 'goal',
  milestone = false,
  className,
  'aria-label': ariaLabel,
  'aria-valuetext': ariaValueText,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const classes = BAR_CLASS[variant]

  return (
    <div
      className={cn(classes.track, className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
    >
      <div
        className={cn(classes.fill, milestone && clamped === 100 && 'is-milestone')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export default memo(ProgressBar)
