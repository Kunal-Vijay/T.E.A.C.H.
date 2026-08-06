import { Check } from 'lucide-react'
import Icon from '../ui/Icon'

interface ConceptTrailProps {
  labels: string[]
  activeIndex: number | null
  completedConcepts: number[]
}

export default function ConceptTrail({
  labels,
  activeIndex,
  completedConcepts,
}: ConceptTrailProps) {
  if (labels.length <= 1) {
    return null
  }

  return (
    <div className="concept-trail" aria-label="Key concepts">
      {labels.map((label, index) => {
        const isActive = activeIndex === index
        const isDone = completedConcepts.includes(index)
        const shortLabel = label.length > 36 ? `${label.slice(0, 33)}…` : label
        return (
          <span
            key={`trail-${index}`}
            className={`concept-trail-chip${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}${!isActive && !isDone ? ' is-pending' : ''}`}
            title={label}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {isDone ? (
              <Icon icon={Check} size={12} className="concept-trail-check" aria-hidden="true" />
            ) : null}
            {shortLabel}
          </span>
        )
      })}
    </div>
  )
}
