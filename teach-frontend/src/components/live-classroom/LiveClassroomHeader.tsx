import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '../ui'
import Icon from '../ui/Icon'

interface LiveClassroomHeaderProps {
  subject: string
  lessonTitle: string
  modeLabel: string
  statusLabel: string
  slideLabel: string
  progressPercent: number
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onExit: () => void
}

export default function LiveClassroomHeader({
  subject,
  lessonTitle,
  modeLabel,
  statusLabel,
  slideLabel,
  progressPercent,
  isFullscreen,
  onToggleFullscreen,
  onExit,
}: LiveClassroomHeaderProps) {
  return (
    <header className="live-classroom-header">
      <div className="live-classroom-header__left">
        <nav className="live-classroom-breadcrumb" aria-label="Lesson location">
          <span>{subject}</span>
          <span aria-hidden="true">›</span>
          <span>{lessonTitle}</span>
        </nav>
        <div className="live-classroom-header__chips">
          <span className={`live-classroom-chip live-classroom-chip--status live-classroom-chip--${statusLabel.toLowerCase()}`}>
            ● {statusLabel}
          </span>
          <span className="live-classroom-chip">{slideLabel}</span>
          <span className="live-classroom-chip live-classroom-chip--mode">{modeLabel}</span>
        </div>
      </div>
      <div className="live-classroom-header__right">
        <div className="live-classroom-progress" aria-label={`Lesson progress ${progressPercent}%`}>
          <span className="live-classroom-progress__label">Lesson Progress</span>
          <div className="live-classroom-progress__track">
            <span className="live-classroom-progress__fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="live-classroom-progress__value">{progressPercent}%</span>
        </div>
        <button
          type="button"
          className="live-classroom-header-btn live-classroom-header-btn--ghost"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Icon icon={isFullscreen ? Minimize2 : Maximize2} size={16} />
          <span>{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
        </button>
        <Button type="button" variant="secondary" onClick={onExit}>
          Exit session
        </Button>
      </div>
    </header>
  )
}
