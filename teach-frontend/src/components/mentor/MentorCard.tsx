import { Volume2 } from 'lucide-react'
import type { CSSProperties } from 'react'
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
  const isActive = selected || previewing

  return (
    <article
      id={`mentor-card-${mentor.id}`}
      role="option"
      aria-selected={isActive}
      className={`mentor-picker-card${isActive ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
      style={{
        '--mentor-accent': mentor.visual.accent,
        '--mentor-glow': mentor.visual.glow,
      } as CSSProperties}
    >
      <div className="mentor-picker-card-glow" aria-hidden="true" />

      <button
        type="button"
        className="mentor-picker-card-hit"
        onClick={onFocus}
        onFocus={onFocus}
        aria-describedby={`mentor-card-desc-${mentor.id}`}
      >
        <div className="mentor-picker-card-avatar">
          <StudyMentorAvatar
            mentor={mentor}
            expression={previewing ? 'happy' : 'idle'}
            size="sm"
            showGlow={isActive}
            ariaLabel={`Preview ${mentor.name}`}
          />
        </div>
        <div className="mentor-picker-card-copy">
          <h3 className="mentor-picker-card-name">{mentor.name}</h3>
          <p className="mentor-picker-card-tagline">{mentor.tagline}</p>
          <ul className="mentor-picker-card-traits" id={`mentor-card-desc-${mentor.id}`}>
            {mentor.personality.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>
      </button>

      <div className="mentor-picker-card-actions">
        <button
          type="button"
          className="mentor-picker-voice btn-with-icon"
          onClick={(event) => {
            event.stopPropagation()
            onPreview()
          }}
          aria-label={`Preview ${mentor.name}'s voice`}
        >
          <Icon icon={Volume2} size={15} />
          Voice
        </button>
        <button
          type="button"
          className={`mentor-picker-select${selected ? ' is-selected' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          {selected ? 'Selected' : 'Choose'}
        </button>
      </div>
    </article>
  )
}
