import { useCallback, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Icon from '../ui/Icon'

interface ClassroomExitLinkProps {
  /** When true, confirm before leaving (mid-lesson navigation). */
  requireConfirm?: boolean
  /** Breadcrumb in rhythm bar vs standalone page chrome. */
  variant?: 'breadcrumb' | 'standalone'
  className?: string
}

export default function ClassroomExitLink({
  requireConfirm = false,
  variant = 'breadcrumb',
  className = '',
}: ClassroomExitLinkProps) {
  const navigate = useNavigate()
  const [exiting, setExiting] = useState(false)

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (requireConfirm) {
      const confirmed = window.confirm(
        'Leave this lesson? You can return to this class anytime from Classes.',
      )
      if (!confirmed) {
        return
      }
    }

    setExiting(true)
    window.setTimeout(() => {
      navigate('/student')
    }, 180)
  }, [navigate, requireConfirm])

  return (
    <button
      type="button"
      className={`classroom-exit-link classroom-exit-link--${variant}${exiting ? ' is-exiting' : ''}${className !== '' ? ` ${className}` : ''}`.trim()}
      onClick={handleClick}
      title="Back to Classes"
      aria-label="Back to Classes"
    >
      <Icon icon={ArrowLeft} size={15} strokeWidth={2} className="classroom-exit-link-icon" />
      <span className="classroom-exit-link-label">Classes</span>
    </button>
  )
}
