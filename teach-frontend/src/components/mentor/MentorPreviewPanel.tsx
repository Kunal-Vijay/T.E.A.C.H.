import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
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
      className={`mentor-picker-preview${compact ? ' mentor-picker-preview--compact' : ''}`}
      tabIndex={-1}
      aria-labelledby={`mentor-preview-${mentor.id}`}
      style={{
        '--mentor-accent': mentor.visual.accent,
        '--mentor-glow': mentor.visual.glow,
      } as CSSProperties}
    >
      <div className="mentor-picker-preview-glow" aria-hidden="true" />

      {onClose !== undefined ? (
        <button
          type="button"
          className="mentor-picker-preview-close"
          onClick={onClose}
          aria-label="Close preview"
        >
          <Icon icon={X} size={18} />
        </button>
      ) : null}

      <div className="mentor-picker-preview-hero">
        <StudyMentorAvatar
          mentor={mentor}
          expression={previewExpression}
          size={compact ? 'md' : 'hero'}
          showGlow
          caption={isSpeaking ? demoLine : greetingLine}
        />
      </div>

      <div className="mentor-picker-preview-body">
        <p className="mentor-picker-preview-kicker">AI Tutor</p>
        <h2 id={`mentor-preview-${mentor.id}`} className="mentor-picker-preview-name">
          {mentor.name}
        </h2>
        <p className="mentor-picker-preview-tagline">{mentor.tagline}</p>

        <dl className="mentor-picker-preview-meta">
          <div>
            <dt>Personality</dt>
            <dd>{mentor.personality.traits.join(' · ')}</dd>
          </div>
          <div>
            <dt>Voice</dt>
            <dd>{mentor.personality.speakingStyle}</dd>
          </div>
          <div>
            <dt>Teaching</dt>
            <dd>{mentor.teachingStyle}</dd>
          </div>
          <div>
            <dt>Best for</dt>
            <dd>{mentor.bestSubjects.join(', ')}</dd>
          </div>
        </dl>

        <blockquote className="mentor-picker-preview-quote">
          &ldquo;{demoLine}&rdquo;
        </blockquote>

        <div className="mentor-picker-preview-actions">
          {isSupported ? (
            <>
              <button
                type="button"
                className="mentor-picker-action mentor-picker-action--ghost btn-with-icon"
                onClick={() => { void previewVoice(mentor) }}
                disabled={isSpeaking}
              >
                <Icon icon={Volume2} size={16} />
                Voice preview
              </button>
              <button
                type="button"
                className="mentor-picker-action mentor-picker-action--secondary btn-with-icon"
                onClick={() => { void playDemo(mentor) }}
                disabled={isSpeaking}
              >
                <Icon icon={Play} size={16} />
                30s demo
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="mentor-picker-action mentor-picker-action--primary"
            onClick={onSelect}
          >
            Choose {mentor.name}
          </button>
        </div>
      </div>
    </section>
  )
}
