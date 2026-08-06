import { Check, Keyboard, MessageCircle, Mic } from 'lucide-react'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'
import { readInteractiveAvatarFlag } from '../avatar/AvatarProvider'
import Icon from '../ui/Icon'
import { DOUBT_QUICK_ACTIONS } from '../../constants/doubtCopy'
import type { MentorDefinition } from '../../types/mentor.types'

interface VoiceDoubtPromptProps {
  visible: boolean
  mentor: MentorDefinition
  invitationLine: string
  onAskVoice: () => void
  onAskType: () => void
  onQuickAsk: (message: string) => void
  onSkip: () => void
}

/** Premium conversational invite — mentor asks the student directly. */
export default function VoiceDoubtPrompt({
  visible,
  mentor,
  invitationLine,
  onAskVoice,
  onAskType,
  onQuickAsk,
  onSkip,
}: VoiceDoubtPromptProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="doubt-moment" role="dialog" aria-modal="true" aria-label="Ask your AI Tutor">
      <div className="doubt-moment-backdrop" aria-hidden="true" />
      <div className="doubt-moment-panel">
        <div className="doubt-moment-glow" aria-hidden="true" />

        <div className="doubt-moment-mentor">
          <div className="doubt-moment-avatar-wrap">
            <StudyMentorAvatar
              mentor={mentor}
              expression="smile"
              avatarInput={readInteractiveAvatarFlag() ? { preferHappy: true } : undefined}
              size="lg"
              showGlow
              ariaLabel={`${mentor.name} is ready to answer your questions`}
            />
          </div>
          <div className="doubt-moment-bubble">
            <span className="doubt-moment-bubble-icon" aria-hidden="true">
              <Icon icon={MessageCircle} size={18} />
            </span>
            <p className="doubt-moment-bubble-text">&ldquo;{invitationLine}&rdquo;</p>
            <span className="doubt-moment-bubble-tail" aria-hidden="true" />
          </div>
        </div>

        <div className="doubt-moment-actions">
          <button
            type="button"
            className="doubt-moment-voice-cta"
            onClick={onAskVoice}
          >
            <span className="doubt-moment-voice-cta-icon" aria-hidden="true">
              <span className="doubt-moment-mic-pulse" />
              <Icon icon={Mic} size={22} />
            </span>
            Ask by Voice
          </button>
          <button
            type="button"
            className="doubt-moment-type-cta"
            onClick={onAskType}
          >
            <Icon icon={Keyboard} size={17} />
            Type your Question
          </button>
        </div>

        <div className="doubt-moment-chips" aria-label="Suggested questions">
          {DOUBT_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="doubt-moment-chip"
              onClick={() => { onQuickAsk(action.message) }}
            >
              {action.label}
            </button>
          ))}
        </div>

        <button type="button" className="doubt-moment-continue" onClick={onSkip}>
          <Icon icon={Check} size={16} />
          I understand, continue lesson
        </button>
      </div>
    </div>
  )
}
