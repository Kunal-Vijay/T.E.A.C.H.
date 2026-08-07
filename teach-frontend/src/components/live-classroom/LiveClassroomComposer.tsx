import { ArrowUp, Loader2, Mic, Square } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import Icon from '../ui/Icon'

const MAX_INPUT_HEIGHT_PX = 96

interface LiveClassroomComposerProps {
  message: string
  onChange: (value: string) => void
  onSend: () => void
  onSpeakClick: () => void
  isListening: boolean
  canSend: boolean
  canInteract: boolean
  submitting: boolean
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}

export default function LiveClassroomComposer({
  message,
  onChange,
  onSend,
  onSpeakClick,
  isListening,
  canSend,
  canInteract,
  submitting,
  onKeyDown,
}: LiveClassroomComposerProps) {
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
    <footer className="live-classroom-composer">
      <p className="live-classroom-composer__label">Ask anything about this lesson</p>
      <div
        className={`live-classroom-composer__bar${isListening ? ' is-listening' : ''}${!canInteract ? ' is-disabled' : ''}`}
      >
        <button
          type="button"
          className={`live-classroom-composer__mic${isListening ? ' is-active' : ''}`}
          disabled={!canInteract || submitting}
          onClick={onSpeakClick}
          aria-label={isListening ? 'Stop listening and send' : 'Voice input'}
        >
          <span className="live-classroom-composer__mic-ring" aria-hidden="true" />
          <Icon icon={isListening ? Square : Mic} size={20} strokeWidth={2} />
        </button>

        <textarea
          ref={textareaRef}
          className="live-classroom-composer__input"
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
          className="live-classroom-composer__send"
          disabled={!canSend}
          onClick={onSend}
          aria-label="Send message"
        >
          {submitting ? (
            <Icon icon={Loader2} size={18} className="live-classroom-composer__spinner" />
          ) : (
            <Icon icon={ArrowUp} size={20} strokeWidth={2.25} />
          )}
        </button>
      </div>
      <p className="live-classroom-composer__hint">
        Press Enter to send · Shift + Enter for new line
      </p>
    </footer>
  )
}
