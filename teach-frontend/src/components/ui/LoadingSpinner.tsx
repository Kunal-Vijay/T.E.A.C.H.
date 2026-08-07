import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

interface LoadingSpinnerProps {
  size?: number
  className?: string
  label?: string
}

function LoadingSpinner({ size = 16, className, label = 'Loading' }: LoadingSpinnerProps) {
  return (
    <Loader2
      size={size}
      strokeWidth={1.75}
      className={cn('empty-state-spinner', className)}
      role="status"
      aria-label={label}
    />
  )
}

export default memo(LoadingSpinner)
