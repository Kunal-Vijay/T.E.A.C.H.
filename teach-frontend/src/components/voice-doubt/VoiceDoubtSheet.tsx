import { useEffect, useRef, useState } from 'react'
import { Mic, Pencil, RotateCcw, Send, X } from 'lucide-react'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'
import Icon from '../ui/Icon'
import VoiceWaveform from './VoiceWaveform'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'

export type VoiceDoubtSheetMode = 'voice' | 'type'

export type VoiceDoubtSheetPhase = 'listening' | 'review' | 'typing' | 'thinking' | 'answer'

interface VoiceDoubtSheetProps {
  open: boolean
  mode: VoiceDoubtSheetMode
  mentor: MentorDefinition
  phase: VoiceDoubtSheetPhase
  answerText?: string
  permissionDeniedMessage?: string | null
  onClose: () => void
  onSend: (message: string) => Promise<void>
  onSwitchToType: () => void
}

function resolveMentorExpression(
  phase: VoiceDoubtSheetPhase,
  mode: VoiceDoubtSheetMode,
  recognitionPhase: string,
): ExpressionState {
  if (phase === 'thinking') {
    return 'thinking'
  }
  if (phase === 'answer') {
    return 'speaking'
  }
  if (mode === 'voice' && (phase === 'listening' || recognitionPhase === 'listening' || recognitionPhase === 'review')) {
    return 'listening'
  }
  return 'curious'
}

export default function VoiceDoubtSheet({
  open,
  mode,
  mentor,
  phase,
  answerText = '',
  permissionDeniedMessage = null,
  onClose,
  onSend,
  onSwitchToType,
}: VoiceDoubtSheetProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [typedQuestion, setTypedQuestion] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [sending, setSending] = useState(false)

  const {
    isSupported,
    phase: recognitionPhase,
    transcript,
    liveTranscript,
    errorCode,
    startListening,
    abortListening,
    reset: resetRecognition,
    setTranscript,
    setPhase: setRecognitionPhase,
  } = useVoiceRecognition({ silenceTimeoutMs: 1500 })

  const displayTranscript = liveTranscript || transcript
  const mentorExpression = resolveMentorExpression(phase, mode, recognitionPhase)

  useEffect(() => {
    if (open && mode === 'voice' && !isSupported) {
      onSwitchToType()
    }
  }, [open, mode, isSupported, onSwitchToType])

  useEffect(() => {
    if (!open) {
      abortListening()
      resetRecognition()
      setTypedQuestion('')
      setIsEditing(false)
      setSending(false)
      return
    }

    if (mode === 'voice' && phase === 'listening' && recognitionPhase === 'idle') {
      startListening()
    }
  }, [open, mode, phase, recognitionPhase, startListening, abortListening, resetRecognition])

  useEffect(() => {
    if (errorCode === 'not-allowed' && open) {
      onSwitchToType()
    }
  }, [errorCode, open, onSwitchToType])

  useEffect(() => {
    if (mode === 'type' && open && phase === 'typing') {
      inputRef.current?.focus()
    }
  }, [mode, open, phase])

  useEffect(() => {
    if (permissionDeniedMessage !== null && open && mode === 'type') {
      inputRef.current?.focus()
    }
  }, [permissionDeniedMessage, open, mode])

  if (!open) {
    return null
  }

  const handleRetry = () => {
    setIsEditing(false)
    setTranscript('')
    setRecognitionPhase('idle')
    startListening()
  }

  const handleSendTranscript = async () => {
    const message = (mode === 'type' ? typedQuestion : transcript).trim()
    if (message === '' || sending) {
      return
    }
    setSending(true)
    try {
      await onSend(message)
    } finally {
      setSending(false)
    }
  }

  const showListening = mode === 'voice' && (phase === 'listening' || recognitionPhase === 'listening')
  const showReview = mode === 'voice' && (phase === 'listening' && recognitionPhase === 'review')
  const showTyping = mode === 'type' && phase === 'typing'
  const showThinking = phase === 'thinking'
  const showAnswer = phase === 'answer'

  const statusLabel = showThinking
    ? `${mentor.name} is thinking…`
    : showAnswer
      ? `${mentor.name} says`
      : showListening
        ? `${mentor.name} is listening`
        : `${mentor.name}`

  return (
    <div className="doubt-sheet-shell" role="dialog" aria-modal="true" aria-label="Ask your AI Tutor">
      <button type="button" className="doubt-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="doubt-sheet">
        <div className="doubt-sheet-glow" aria-hidden="true" />

        <header className="doubt-sheet-header">
          <div className="doubt-sheet-mentor-row">
            <StudyMentorAvatar
              mentor={mentor}
              expression={mentorExpression}
              size="md"
              showGlow
              ariaLabel={statusLabel}
            />
            <div className="doubt-sheet-header-copy">
              <p className="doubt-sheet-kicker">{statusLabel}</p>
              <h3 className="doubt-sheet-title">
                {showThinking ? 'Working on your answer…' : showAnswer ? 'Here\'s what I think' : 'Your turn — ask anything'}
              </h3>
            </div>
          </div>
          {!showThinking && !showAnswer ? (
            <button type="button" className="doubt-sheet-close" aria-label="Close" onClick={onClose}>
              <Icon icon={X} size={18} />
            </button>
          ) : null}
        </header>

        {permissionDeniedMessage !== null && showTyping ? (
          <p className="doubt-sheet-alert" role="alert">{permissionDeniedMessage}</p>
        ) : null}

        {showListening ? (
          <div className="doubt-sheet-listening">
            <div className="doubt-sheet-mic-hero">
              <span className="doubt-sheet-mic-pulse" aria-hidden="true" />
              <span className="doubt-sheet-mic-pulse doubt-sheet-mic-pulse-b" aria-hidden="true" />
              <Icon icon={Mic} size={36} />
            </div>
            <VoiceWaveform active />
            <p className="doubt-sheet-listening-label">Listening…</p>
            <p className="doubt-sheet-transcript" aria-live="polite">
              {displayTranscript !== '' ? `"${displayTranscript}"` : 'Speak naturally — I\'ll stop when you pause.'}
            </p>
          </div>
        ) : null}

        {showReview ? (
          <div className="doubt-sheet-review">
            <p className="doubt-sheet-review-label">You asked</p>
            {isEditing ? (
              <textarea
                ref={inputRef}
                className="doubt-sheet-input"
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={3}
                aria-label="Edit your question"
              />
            ) : (
              <p className="doubt-sheet-review-text">&ldquo;{transcript}&rdquo;</p>
            )}
            <div className="doubt-sheet-review-actions">
              <button
                type="button"
                className="doubt-sheet-send-cta"
                disabled={transcript.trim() === '' || sending}
                onClick={() => { void handleSendTranscript() }}
              >
                <Icon icon={Send} size={18} />
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button
                type="button"
                className="doubt-sheet-secondary-btn"
                onClick={() => {
                  setIsEditing(true)
                  setTimeout(() => inputRef.current?.focus(), 0)
                }}
              >
                <Icon icon={Pencil} size={16} />
                Edit
              </button>
              <button type="button" className="doubt-sheet-secondary-btn" onClick={handleRetry}>
                <Icon icon={RotateCcw} size={16} />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {showTyping ? (
          <div className="doubt-sheet-typing">
            <textarea
              ref={inputRef}
              className="doubt-sheet-input doubt-sheet-input-large"
              placeholder="Why doesn't the wall move when I push it?"
              value={typedQuestion}
              onChange={(event) => setTypedQuestion(event.target.value)}
              rows={4}
              aria-label="Type your question"
            />
            <button
              type="button"
              className="doubt-sheet-send-cta"
              disabled={typedQuestion.trim() === '' || sending}
              onClick={() => { void handleSendTranscript() }}
            >
              <Icon icon={Send} size={18} />
              {sending ? 'Sending…' : 'Send question'}
            </button>
          </div>
        ) : null}

        {showThinking ? (
          <div className="doubt-sheet-thinking" aria-live="polite" aria-busy="true">
            <div className="doubt-sheet-thinking-dots">
              <span /><span /><span />
            </div>
            <p>Give me a moment to think this through…</p>
          </div>
        ) : null}

        {showAnswer ? (
          <div className="doubt-sheet-answer">
            <p className="doubt-sheet-answer-text">{answerText}</p>
          </div>
        ) : null}

        {!isSupported && mode === 'voice' && phase === 'listening' ? (
          <p className="doubt-sheet-alert">
            Voice input isn&apos;t supported here. Switching to typing…
          </p>
        ) : null}
      </div>
    </div>
  )
}
