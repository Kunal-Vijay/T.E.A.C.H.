import { memo } from 'react'
import { BookOpen, Clock, Layers } from 'lucide-react'
import Icon from './Icon'

export interface ClassCardMetaProps {
  subject: string
  grade: string
  chapterName: string
  durationMinutes: number
}

function ClassCardMeta({
  subject,
  grade,
  chapterName,
  durationMinutes,
}: ClassCardMetaProps) {
  return (
    <ul className="class-catalog-meta">
      <li>
        <Icon icon={BookOpen} size={14} className="class-catalog-meta-icon" />
        <span>{subject} · Grade {grade}</span>
      </li>
      <li>
        <Icon icon={Layers} size={14} className="class-catalog-meta-icon" />
        <span>{chapterName}</span>
      </li>
      <li>
        <Icon icon={Clock} size={14} className="class-catalog-meta-icon" />
        <span>{durationMinutes} min lesson</span>
      </li>
    </ul>
  )
}

export default memo(ClassCardMeta)
