import { NovaTutor } from '../nova'
import { useMentor } from '../../context/MentorContext'
import { mentorVisualStyle } from '../../lib/tutor'
import TutorThinkingDots from './TutorThinkingDots'

interface NovaThinkingStageProps {
  statusLabel: string
  detail?: string
}

/** Nova static PNG with thinking aura — no speaking GIF. */
export default function NovaThinkingStage({ statusLabel, detail }: NovaThinkingStageProps) {
  const { tutor } = useMentor()

  return (
    <div className="nova-thinking-stage" aria-label={`${tutor.name} is preparing your lesson`}>
      <div className="nova-thinking-stage__aura" aria-hidden="true">
        <span className="nova-thinking-stage__ring nova-thinking-stage__ring--outer" />
        <span className="nova-thinking-stage__ring nova-thinking-stage__ring--inner" />
        <span className="nova-thinking-stage__halo" />
        <span className="nova-thinking-stage__particle nova-thinking-stage__particle--a" />
        <span className="nova-thinking-stage__particle nova-thinking-stage__particle--b" />
        <span className="nova-thinking-stage__particle nova-thinking-stage__particle--c" />
        <span className="nova-thinking-stage__particle nova-thinking-stage__particle--d" />
      </div>

      <div
        className={`study-mentor study-mentor-xl study-mentor-${tutor.id} mentor-expr-thinking has-glow is-preparing`}
        style={mentorVisualStyle(tutor)}
        data-tutor-id={tutor.id}
      >
        <div className="study-mentor-stage">
          <NovaTutor preparing size="xl" speaking={false} label={statusLabel} />
        </div>
      </div>

      <div className="nova-thinking-stage__status" aria-live="polite">
        <TutorThinkingDots className="nova-thinking-stage__dots" />
        <p className="nova-thinking-stage__headline">{statusLabel}</p>
        {detail != null && detail !== '' ? (
          <p className="nova-thinking-stage__detail">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
