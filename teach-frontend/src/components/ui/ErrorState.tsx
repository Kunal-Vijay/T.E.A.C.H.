import { AlertCircle, X } from 'lucide-react'
import Icon from './Icon'

interface ErrorStateProps {
  message: string
  onDismiss?: () => void
}

export default function ErrorState({ message, onDismiss }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <Icon icon={AlertCircle} size={18} className="error-state-icon" />
      <p className="error-state-message">{message}</p>
      {onDismiss != null ? (
        <button type="button" className="error-state-dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <Icon icon={X} size={16} />
        </button>
      ) : null}
    </div>
  )
}
