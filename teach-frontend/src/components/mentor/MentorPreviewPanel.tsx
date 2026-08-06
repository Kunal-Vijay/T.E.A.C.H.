import { useEffect, useMemo, useRef } from 'react'
import { Play, Volume2, X } from 'lucide-react'
import { pickDialogue } from '../../lib/mentors/dialogue'
import { useMentorVoice } from '../../hooks/useMentorVoice'
import type { MentorDefinition } from '../../types/mentor.types'
import StudyMentorAvatar from './StudyMentorAvatar'
import Icon from '../ui/Icon'

interface MentorPreviewPanelProps {
  mentor: MentorDefinition
  onSelect: () => void
  onClose?: () => void
  compact?: boolean
}

export default function MentorPreviewPanel({
  mentor,
  onSelect,
  onClose,
  compact = false,
}: MentorPreviewPanelProps) {
  const { speechStatus, previewVoice, playDemo, stopPreview, isSupported } = useMentorVoice()
  const panelRef = useRef<HTMLElement>(null)

  const greetingLine = useMemo(() => pickDialogue(mentor, 'greetings'), [mentor])
  const demoLine = useMemo(() => pickDialogue(mentor, 'demoLines'), [mentor])

  useEffect(() => {
    panelRef.current?.focus()
    return () => stopPreview()
  }, [mentor.id, stopPreview])

  const isSpeaking = speechStatus === 'speaking'
  const previewExpression = isSpeaking ? mentor.expression.onSpeak : mentor.expression.onExplain

  return (
    <section
      ref={panelRef}
      className={`mentor-preview card${compact ? ' mentor-preview-compact' : ''}`}
      tabIndex={-1}
      aria-labelledby={`mentor-preview-${mentor.id}`}
    >
      {onClose !== undefined ? (
        <button type="button" className="mentor-preview-close btn btn-ghost" onClick={onClose} aria-label="Close preview">
          <Icon icon={X} size={18} />
        </button>
      ) : null}

      <div className="mentor-preview-hero">
          <StudyMentorAvatar
            mentor={mentor}
            expression={previewExpression}
            size={compact ? 'md' : 'hero'}
          caption={isSpeaking ? demoLine : greetingLine}
        />
      </div>

      <div className="mentor-preview-details">
        <p className="mentor-preview-kicker">AI Study Mentor</p>
        <h2 id={`mentor-preview-${mentor.id}`}>{mentor.name}</h2>
        <p className="mentor-preview-tagline">{mentor.tagline}</p>

        <dl className="mentor-preview-meta">
          <div>
            <dt>Personality</dt>
            <dd>{mentor.personality.traits.join(' · ')}</dd>
          </div>
          <div>
            <dt>Voice style</dt>
            <dd>{mentor.personality.speakingStyle}</dd>
          </div>
          <div>
            <dt>Teaching style</dt>
            <dd>{mentor.teachingStyle}</dd>
          </div>
          <div>
            <dt>Best subjects</dt>
            <dd>{mentor.bestSubjects.join(', ')}</dd>
          </div>
        </dl>

        <blockquote className="mentor-preview-quote">&ldquo;{demoLine}&rdquo;</blockquote>

        <div className="mentor-preview-actions">
          {isSupported ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-with-icon"
                onClick={() => { void previewVoice(mentor) }}
                disabled={isSpeaking}
              >
                <Icon icon={Volume2} size={16} />
                Voice preview
              </button>
              <button
                type="button"
                className="btn btn-accent btn-with-icon"
                onClick={() => { void playDemo(mentor) }}
                disabled={isSpeaking}
              >
                <Icon icon={Play} size={16} />
                Try 30-second demo
              </button>
            </>
          ) : null}
          <button type="button" className="btn btn-primary mentor-preview-select" onClick={onSelect}>
            Choose {mentor.name}
          </button>
        </div>
      </div>
    </section>
  )
}
