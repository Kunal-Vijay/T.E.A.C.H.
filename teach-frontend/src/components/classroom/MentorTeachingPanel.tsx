import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import MentorTheater from './MentorTheater'
import TeachingSubtitle from './TeachingSubtitle'
import Icon from '../ui/Icon'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'

interface MentorTeachingPanelProps {
  mentor: MentorDefinition
  expression: ExpressionState
  currentCue: string
  previousCue: string
  keywords: string[]
  cueIndex: number
  totalCues: number
  isSpeaking: boolean
  hasStarted: boolean
  beatPhase?: string
  speechEnabled: boolean
  speechSupported: boolean
  onToggleSpeech: () => void
  onReplay: () => void
  canReplay: boolean
}

export default function MentorTeachingPanel({
  mentor,
  expression,
  currentCue,
  previousCue,
  keywords,
  cueIndex,
  totalCues,
  isSpeaking,
  hasStarted,
  beatPhase,
  speechEnabled,
  speechSupported,
  onToggleSpeech,
  onReplay,
  canReplay,
}: MentorTeachingPanelProps) {
  return (
    <aside className="mentor-teaching-panel" aria-label={`${mentor.name} teaching`}>
      <div className={`mentor-teaching-panel-inner${isSpeaking ? ' is-speaking' : ''}`}>
        <MentorTheater
          mentor={mentor}
          expression={expression}
          isSpeaking={isSpeaking}
          hasStarted={hasStarted}
          beatPhase={beatPhase}
        />

        <TeachingSubtitle
          mentorName={mentor.name}
          currentCue={currentCue}
          previousCue={previousCue}
          keywords={keywords}
          cueIndex={cueIndex}
          totalCues={totalCues}
          isSpeaking={isSpeaking}
          hasStarted={hasStarted}
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
