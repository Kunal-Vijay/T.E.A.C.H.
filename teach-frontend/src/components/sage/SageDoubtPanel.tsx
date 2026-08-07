import { Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  pickRandom,
  SAGE_CLOSINGS,
  SAGE_EMPTY_HINT,
  SAGE_GREETING,
  SAGE_PROMPTS,
  SAGE_THINKING_LABEL,
} from '../../constants/delightCopy'
import SageLogo from '../branding/SageLogo'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { useTypewriter } from '../../hooks/useTypewriter'
import type { DoubtMessageResponse } from '../../types/api.types'

interface SageDoubtPanelProps {
  lessonContext?: string
  onAsk: (message: string) => Promise<DoubtMessageResponse>
  onClose: () => Promise<void>
  onQuestionAsked?: () => void
}

export default function SageDoubtPanel({
  lessonContext,
  onAsk,
  onClose,
  onQuestionAsked,
}: SageDoubtPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<DoubtMessageResponse[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [closingNote] = useState(() => pickRandom(SAGE_CLOSINGS))

  const latestMessage = messages[messages.length - 1]
  const streamingText = useTypewriter(
    latestMessage?.ai_response ?? '',
    streamingMessageId === latestMessage?.message_id,
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading, streamingText])

  useEffect(() => {
    if (streamingMessageId === null || latestMessage === undefined) {
      return undefined
    }
    if (streamingText.length >= latestMessage.ai_response.length) {
      const timeoutId = window.setTimeout(() => setStreamingMessageId(null), 120)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [streamingText, latestMessage, streamingMessageId])

  const submitMessage = async (message: string) => {
    const trimmed = message.trim()
    if (trimmed === '' || loading) {
      return
    }
    setLoading(true)
    setInputValue('')
    try {
      const response = await onAsk(trimmed)
      setMessages((previousMessages) => [...previousMessages, response])
      setStreamingMessageId(response.message_id)
      onQuestionAsked?.()
    } finally {
      setLoading(false)
    }
  }

  const prompts = lessonContext != null && lessonContext !== ''
    ? [`Explain "${lessonContext}" more simply`, ...SAGE_PROMPTS.slice(1)]
    : SAGE_PROMPTS

  return (
    <Modal open onClose={onClose} ariaLabel="Ask SAGE" panelClassName="sage-panel">
      <header className="sage-header">
        <div className="sage-header-copy">
          <SageLogo />
          <p className="sage-intro">{SAGE_GREETING}</p>
        </div>
        <button type="button" className="sage-close" aria-label="Close SAGE" onClick={() => { void onClose() }}>
          <Icon icon={X} size={16} />
        </button>
      </header>
      <div className="sage-messages">
        {messages.length === 0 && !loading ? (
          <div className="sage-empty">
            <p className="sage-empty-title">What would help right now?</p>
            <p>{SAGE_EMPTY_HINT}</p>
            <div className="sage-prompts">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="sage-prompt"
                  onClick={() => { void submitMessage(prompt) }}
                >
                  <Icon icon={Sparkles} size={12} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((message) => {
          const isStreaming = streamingMessageId === message.message_id
          const displayText = isStreaming ? streamingText : message.ai_response
          return (
            <div key={message.message_id} className="sage-message-block">
              <div className="student-message">{message.student_message}</div>
              <div className={`sage-message${isStreaming ? ' is-streaming' : ''}`}>{displayText}</div>
            </div>
          )
        })}
        {loading ? (
          <div className="sage-thinking" aria-live="polite" aria-busy="true">
            <span className="sage-thinking-dots" aria-hidden="true">
              <span className="sage-thinking-dot" />
              <span className="sage-thinking-dot" />
              <span className="sage-thinking-dot" />
            </span>
            <span className="sage-thinking-label">{SAGE_THINKING_LABEL}</span>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>
      <div className="sage-composer">
        <label className="sr-only" htmlFor="sage-question-input">Ask SAGE a question</label>
        <input
          id="sage-question-input"
          className="input"
          placeholder="Ask in your own words…"
          aria-label="Ask SAGE a question"
          value={inputValue}
          disabled={loading}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void submitMessage(inputValue)
            }
          }}
        />
        <button
          type="button"
          className={`btn btn-sage btn-with-icon${loading ? ' is-loading' : ''}`}
          onClick={() => { void submitMessage(inputValue) }}
          disabled={loading || inputValue.trim() === ''}
        >
          <Icon icon={Send} size={16} />
          Ask
        </button>
      </div>
      <div className="sage-footer">
        {messages.length > 0 ? (
          <p className="sage-encouragement">{closingNote}</p>
        ) : null}
        <button type="button" className="btn btn-ghost sage-done" onClick={() => { void onClose() }}>
          Done — continue lesson
        </button>
      </div>
    </Modal>
  )
}
