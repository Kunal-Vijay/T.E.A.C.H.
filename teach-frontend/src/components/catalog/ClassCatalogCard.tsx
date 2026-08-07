import { LogIn } from 'lucide-react'
import { Button } from '../ui/Button'
import ClassCardMeta from '../ui/ClassCardMeta'
import StatusBadge from '../ui/StatusBadge'

export interface ClassCatalogCardProps {
  title: string
  subject: string
  grade: string
  chapterName: string
  durationMinutes: number
  isJoining: boolean
  joinDisabled: boolean
  onJoin: () => void
  onPrefetch?: () => void
}

export default function ClassCatalogCard({
  title,
  subject,
  grade,
  chapterName,
  durationMinutes,
  isJoining,
  joinDisabled,
  onJoin,
  onPrefetch,
}: ClassCatalogCardProps) {
  return (
    <article
      className={`class-catalog-card${isJoining ? ' is-joining' : ''}`}
      onMouseEnter={onPrefetch}
    >
      <div className="class-catalog-card-glow" aria-hidden="true" />

      <header className="class-catalog-card-header">
        <StatusBadge variant="catalog" />
      </header>

      <h3 className="class-catalog-card-title">{title}</h3>

      <ClassCardMeta
        subject={subject}
        grade={grade}
        chapterName={chapterName}
        durationMinutes={durationMinutes}
      />

      <footer className="class-catalog-card-footer">
        <Button
          type="button"
          variant="primary"
          icon={LogIn}
          withIcon
          loading={isJoining}
          className="class-catalog-cta"
          disabled={joinDisabled}
          onClick={onJoin}
        >
          {isJoining ? 'Joining…' : 'Attend class'}
        </Button>
      </footer>
    </article>
  )
}
