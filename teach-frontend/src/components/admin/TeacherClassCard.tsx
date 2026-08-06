import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Icon from '../ui/Icon'
import ClassCardMeta from '../ui/ClassCardMeta'
import StatusBadge from '../ui/StatusBadge'
import type { PlanStatus } from '../../types/api.types'

export interface TeacherClassCardProps {
  planId: string
  title: string
  subject: string
  grade: string
  chapterName: string
  durationMinutes: number
  status: PlanStatus
  onPrefetch?: () => void
}

export default function TeacherClassCard({
  planId,
  title,
  subject,
  grade,
  chapterName,
  durationMinutes,
  status,
  onPrefetch,
}: TeacherClassCardProps) {
  return (
    <Link
      to={`/teacher/classes/${planId}`}
      className="class-catalog-card teacher-class-card"
      onMouseEnter={onPrefetch}
    >
      <div className="class-catalog-card-glow" aria-hidden="true" />

      <header className="class-catalog-card-header">
        <StatusBadge variant="hub" status={status} />
      </header>

      <h3 className="class-catalog-card-title">{title}</h3>

      <ClassCardMeta
        subject={subject}
        grade={grade}
        chapterName={chapterName}
        durationMinutes={durationMinutes}
      />

      <footer className="class-catalog-card-footer">
        <span className="teacher-class-link-hint">
          View plan
          <Icon icon={ArrowRight} size={16} />
        </span>
      </footer>
    </Link>
  )
}
