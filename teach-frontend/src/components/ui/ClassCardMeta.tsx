import { memo } from 'react'
import { BookOpen, Layers } from 'lucide-react'
import Icon from './Icon'

export interface ClassCardMetaProps {
  subject: string
  grade: string
  chapterName: string
}

function ClassCardMeta({
  subject,
  grade,
  chapterName,
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
    </ul>
  )
}

export default memo(ClassCardMeta)
