interface NovaSessionStatusProps {
  isSpeaking: boolean
  isListening: boolean
  isSubmitting: boolean
  liveCaption: string
  mode: 'teach' | 'doubt' | 'viva'
}

export default function NovaSessionStatus({
  isSpeaking,
  isListening,
  isSubmitting,
  liveCaption,
  mode,
}: NovaSessionStatusProps) {
  if (isSpeaking) {
    return (
      <div className="nova-session-status nova-session-status--speaking" aria-live="polite">
        <span className="nova-session-status__label">Nova is explaining</span>
        {liveCaption.trim() !== '' ? (
          <p className="nova-session-status__caption">{liveCaption}</p>
        ) : null}
      </div>
    )
  }

  if (isListening) {
    return (
      <p className="nova-session-status nova-session-status--listening" aria-live="polite">
        Nova is listening…
      </p>
    )
  }

  if (isSubmitting) {
    return (
      <p className="nova-session-status nova-session-status--thinking" aria-live="polite">
        Nova is thinking…
      </p>
    )
  }

  const readyLabel = mode === 'doubt'
    ? '✓ Ready for your next question'
    : '✓ Ready to continue'

  return (
    <p className="nova-session-status nova-session-status--ready" aria-live="polite">
      {readyLabel}
    </p>
  )
}
