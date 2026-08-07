import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import Icon from '../ui/Icon'

const VISIBLE_MS = 2000
const EXIT_MS = 280

interface CelebrationMomentProps {
  show: boolean
  title: string
  subtitle?: string
  xp?: number
  onDismiss: () => void
  placement?: 'inline'
}

export default function CelebrationMoment({
  show,
  title,
  subtitle,
  xp,
  onDismiss,
  placement = 'inline',
}: CelebrationMomentProps) {
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!show) {
      return undefined
    }

    let cancelled = false
    setMounted(true)
    setExiting(false)

    const exitTimer = window.setTimeout(() => {
      if (!cancelled) {
        setExiting(true)
      }
    }, VISIBLE_MS)

    const dismissTimer = window.setTimeout(() => {
      if (!cancelled) {
        setMounted(false)
        setExiting(false)
        onDismiss()
      }
    }, VISIBLE_MS + EXIT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(exitTimer)
      window.clearTimeout(dismissTimer)
    }
  }, [show, onDismiss, title, subtitle, xp])

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`celebration-toast-host celebration-toast-host--${placement}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`celebration-toast${exiting ? ' is-exiting' : ''}`}>
        <div className="celebration-toast-icon" aria-hidden="true">
          <Icon icon={Sparkles} size={14} />
        </div>
        <div className="celebration-toast-body">
          <p className="celebration-toast-title">{title}</p>
          {subtitle != null && subtitle !== '' ? (
            <p className="celebration-toast-desc">{subtitle}</p>
          ) : null}
        </div>
        {xp != null && xp > 0 ? (
          <span className="celebration-toast-xp">+{xp} XP</span>
        ) : null}
      </div>
    </div>
  )
}
