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
    <div className="concept-trail" aria-label="Lesson progress">
      {labels.map((label, index) => {
        const isActive = activeIndex === index
        const isDone = completedConcepts.includes(index)
        const shortLabel = label.length > 28 ? `${label.slice(0, 25)}…` : label
        return (
          <span
            key={`trail-${index}`}
            className={`concept-trail-chip${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
            title={label}
          >
            {shortLabel}
          </span>
        )
      })}
    </div>
  )
}
