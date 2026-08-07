import { ArrowRight, Calendar, Layers, Sparkles } from 'lucide-react'
import { memo, type KeyboardEvent, type MouseEvent } from 'react'
import Icon from '../ui/Icon'
import StatusBadge from '../ui/StatusBadge'

export interface TopicCatalogCardProps {
  title: string
  subject: string
  description: string
  topicCount: number
  recordingDateLabel: string | null
  recordingStatus: 'Completed' | 'Recorded'
  tutorName?: string
  onOpen: (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => void
  onPrefetch?: () => void
}

function TopicCatalogCard({
  title,
  subject,
  description,
  topicCount,
  recordingDateLabel,
  recordingStatus,
  tutorName = 'Nova',
  onOpen,
  onPrefetch,
}: TopicCatalogCardProps) {
  const topicLabel = topicCount === 1 ? '1 topic' : `${topicCount} topics`

  return (
    <button
      type="button"
      className="class-catalog-card topic-catalog-card recorded-class-card recorded-class-card--interactive"
      onClick={onOpen}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-label={`Open ${title}`}
    >
      <div className="class-catalog-card-glow" aria-hidden="true" />

      <header className="recorded-class-card-header">
        <StatusBadge variant="hub" status="published" label={subject} />
        <span
          className={`recorded-class-status recorded-class-status--${recordingStatus.toLowerCase()}`}
        >
          {recordingStatus}
        </span>
      </header>

      <div className="recorded-class-card-body">
        <h3 className="recorded-class-card-title">{title}</h3>
        <p className="recorded-class-card-description">{description}</p>
      </div>

      <ul className="recorded-class-meta-grid" aria-label="Class details">
        <li>
          <Icon icon={Layers} size={14} className="recorded-class-meta-icon" />
          <span>{topicLabel}</span>
        </li>
        {recordingDateLabel !== null ? (
          <li>
            <Icon icon={Calendar} size={14} className="recorded-class-meta-icon" />
            <span>{recordingDateLabel}</span>
          </li>
        ) : null}
        <li>
          <Icon icon={Sparkles} size={14} className="recorded-class-meta-icon" />
          <span>Taught by {tutorName}</span>
        </li>
      </ul>

      <footer className="recorded-class-card-hint" aria-hidden="true">
        <span className="recorded-class-card-hint-text">Open class</span>
        <Icon icon={ArrowRight} size={15} className="recorded-class-card-hint-arrow" />
      </footer>
    </button>
  )
}

export default memo(TopicCatalogCard)
