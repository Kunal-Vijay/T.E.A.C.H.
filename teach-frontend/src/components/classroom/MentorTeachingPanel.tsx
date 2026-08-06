import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import MentorTheater from './MentorTheater'
import TeachingSubtitle from './TeachingSubtitle'
import Icon from '../ui/Icon'
import type { AvatarMachineInput } from '../avatar/AvatarMachineState'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'

interface MentorTeachingPanelProps {
  mentor: MentorDefinition
  expression: ExpressionState
  avatarInput?: AvatarMachineInput
  currentCue: string
  previousCue: string
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

function mentorPanelStatus(isSpeaking: boolean, hasStarted: boolean) {
  if (isSpeaking) {
    return { label: 'Teaching', mod: 'live' as const }
  }
  if (!hasStarted) {
    return { label: 'Ready', mod: 'ready' as const }
  }
  return { label: 'Standby', mod: 'standby' as const }
}

export default function MentorTeachingPanel({
  mentor,
  expression,
  avatarInput,
  currentCue,
  previousCue,
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
  const status = mentorPanelStatus(isSpeaking, hasStarted)

  return (
    <aside className="classroom-mentor mentor-teaching-panel" aria-label={`${mentor.name} teaching`}>
      <div className={`classroom-mentor-inner mentor-teaching-panel-inner${isSpeaking ? ' is-speaking' : ''}`}>
        <header className="mentor-panel-header">
          <div className="mentor-panel-identity">
            <span className="mentor-panel-kicker">Your AI Tutor</span>
            <p className="mentor-panel-name">{mentor.name}</p>
          </div>
          <span className={`mentor-panel-status mentor-panel-status--${status.mod}`}>
            {status.mod === 'live' ? <span className="mentor-panel-status-dot" aria-hidden="true" /> : null}
            {status.label}
          </span>
        </header>

        <div className="mentor-panel-stage">
          <MentorTheater
            mentor={mentor}
            expression={expression}
            avatarInput={avatarInput}
            isSpeaking={isSpeaking}
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
