import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import MentorTheater from './MentorTheater'
import TeachingSubtitle from './TeachingSubtitle'
import Icon from '../ui/Icon'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import type { TutorPresence } from '../../lib/tutor/tutorPresence'

interface MentorTeachingPanelProps {
  mentor: MentorDefinition
  expression: ExpressionState
  isTalking?: boolean
  currentCue: string
  previousCue: string
  cueIndex: number
  totalCues: number
  showSpeaking: boolean
  tutorPresence: TutorPresence
  hasStarted: boolean
  beatPhase?: string
  highlightWords?: string[]
  speechEnabled: boolean
  speechSupported: boolean
  onToggleSpeech: () => void
  onReplay: () => void
  canReplay: boolean
}

export default function MentorTeachingPanel({
  mentor,
  expression,
  isTalking = false,
  currentCue,
  previousCue,
  cueIndex,
  totalCues,
  showSpeaking,
  tutorPresence,
  hasStarted,
  beatPhase,
  highlightWords = [],
  speechEnabled,
  speechSupported,
  onToggleSpeech,
  onReplay,
  canReplay,
}: MentorTeachingPanelProps) {
  return (
    <aside className="classroom-mentor mentor-teaching-panel" aria-label={`${mentor.name} teaching`}>
      <div className={`classroom-mentor-inner mentor-teaching-panel-inner${showSpeaking ? ' is-speaking' : ''}${tutorPresence.mode === 'listening' ? ' is-listening' : ''}${tutorPresence.mode === 'thinking' ? ' is-thinking' : ''}`}>
        <header className="mentor-panel-header">
          <div className="mentor-panel-identity">
            <span className="mentor-panel-kicker">Your AI Tutor</span>
            <p className="mentor-panel-name">{mentor.name}</p>
          </div>
          <span
            className={`mentor-panel-status mentor-panel-status--${tutorPresence.mode}`}
            aria-live="polite"
          >
            {tutorPresence.mode === 'speaking' ? (
              <span className="mentor-panel-status-dot" aria-hidden="true" />
            ) : null}
            {tutorPresence.mode === 'thinking' ? (
              <span className="mentor-panel-status-thinking" aria-hidden="true">
                <span /><span /><span />
              </span>
            ) : null}
            {tutorPresence.label}
          </span>
        </header>

        <div className="mentor-panel-stage">
          <MentorTheater
            mentor={mentor}
            expression={expression}
            isTalking={isTalking}
            showSpeaking={showSpeaking}
            tutorPresence={tutorPresence}
            hasStarted={hasStarted}
            beatPhase={beatPhase}
          />
        </div>

        <TeachingSubtitle
          mentorName={mentor.name}
          currentCue={currentCue}
          previousCue={previousCue}
          cueIndex={cueIndex}
          totalCues={totalCues}
          showSpeaking={showSpeaking}
          tutorPresence={tutorPresence}
          hasStarted={hasStarted}
          highlightWords={highlightWords}
        />

        <div className="mentor-panel-controls">
          {speechSupported ? (
            <button
              type="button"
              className={`mentor-panel-btn${speechEnabled ? ' is-on' : ''}`}
              onClick={onToggleSpeech}
              aria-pressed={speechEnabled}
            >
              <Icon icon={speechEnabled ? Volume2 : VolumeX} size={16} />
              {speechEnabled ? 'Audio on' : 'Enable audio'}
            </button>
          ) : null}
          {canReplay ? (
            <button type="button" className="mentor-panel-btn mentor-panel-btn-ghost" onClick={onReplay}>
              <Icon icon={RotateCcw} size={16} />
              Replay
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
