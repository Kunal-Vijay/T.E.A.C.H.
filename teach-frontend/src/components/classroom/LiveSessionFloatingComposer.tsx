import { ArrowRight, Loader2, Mic, Square } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import Icon from '../ui/Icon'

const MAX_INPUT_HEIGHT_PX = 96

interface LiveSessionFloatingComposerProps {
  message: string
  onChange: (value: string) => void
  onSend: () => void
  onSpeakClick: () => void
  isListening: boolean
  canSend: boolean
  canInteract: boolean
  submitting: boolean
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  showKicker?: boolean
}

export default function LiveSessionFloatingComposer({
  message,
  onChange,
  onSend,
  onSpeakClick,
  isListening,
  canSend,
  canInteract,
  submitting,
  onKeyDown,
  showKicker = true,
}: LiveSessionFloatingComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = textareaRef.current
    if (node == null) {
      return
    }
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`
  }, [message])

  return (
    <div className="live-session-composer-dock">
      <div
        className={`live-session-composer-bar${isListening ? ' is-listening' : ''}${!canInteract ? ' is-disabled' : ''}`}
      >
        <button
          type="button"
          className={`live-session-composer-mic${isListening ? ' is-active' : ''}`}
          disabled={!canInteract || submitting}
          onClick={onSpeakClick}
          aria-label={isListening ? 'Stop listening and send' : 'Voice input'}
        >
          <span className="live-session-composer-mic-ring" aria-hidden="true" />
          <Icon icon={isListening ? Square : Mic} size={20} strokeWidth={2} />
        </button>

        <textarea
          ref={textareaRef}
          className="live-session-composer-input"
          value={message}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Nova anything about this lesson…"
          disabled={!canInteract}
          rows={1}
          aria-label="Message Nova"
        />

        <button
          type="button"
          className="live-session-composer-send"
          disabled={!canSend}
          onClick={onSend}
          aria-label="Send message"
        >
          {submitting ? (
            <Icon icon={Loader2} size={18} className="live-session-composer-send-spinner" />
          ) : (
            <>
              <span>Send</span>
              <Icon icon={ArrowRight} size={18} strokeWidth={2.25} />
            </>
          )}
        </button>
      </div>
      {showKicker ? (
        <p className="live-session-composer-kicker">Press Enter to send</p>
      ) : null}
    </div>
  )
}
