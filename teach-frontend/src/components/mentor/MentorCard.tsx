import { Volume2 } from 'lucide-react'
import type { MentorDefinition } from '../../types/mentor.types'
import StudyMentorAvatar from './StudyMentorAvatar'
import Icon from '../ui/Icon'

interface MentorCardProps {
  mentor: MentorDefinition
  selected: boolean
  previewing: boolean
  onSelect: () => void
  onPreview: () => void
  onFocus: () => void
}

export default function MentorCard({
  mentor,
  selected,
  previewing,
  onSelect,
  onPreview,
  onFocus,
}: MentorCardProps) {
  return (
    <article
      className={`mentor-card card${selected ? ' is-selected' : ''}${previewing ? ' is-previewing' : ''}`}
      aria-labelledby={`mentor-card-${mentor.id}`}
    >
      <button
        type="button"
        className="mentor-card-hit"
        onClick={onFocus}
        onFocus={onFocus}
        aria-pressed={selected}
        aria-describedby={`mentor-card-desc-${mentor.id}`}
      >
        <div className="mentor-card-preview">
          <StudyMentorAvatar
            mentor={mentor}
            expression={previewing ? 'happy' : 'idle'}
            size="sm"
            ariaLabel={`Preview ${mentor.name}`}
          />
        </div>
        <div className="mentor-card-copy">
          <h3 id={`mentor-card-${mentor.id}`}>{mentor.name}</h3>
          <p className="mentor-card-tagline">{mentor.tagline}</p>
          <ul className="mentor-card-traits" id={`mentor-card-desc-${mentor.id}`}>
            {mentor.personality.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>
      </button>
      <div className="mentor-card-actions">
        <button
          type="button"
          className="btn btn-secondary btn-with-icon mentor-card-voice"
          onClick={(event) => {
            event.stopPropagation()
            onPreview()
          }}
          aria-label={`Preview ${mentor.name}'s voice`}
        >
          <Icon icon={Volume2} size={16} />
          Voice
        </button>
        <button
          type="button"
          className={`btn btn-primary mentor-card-select${selected ? ' is-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  )
}
