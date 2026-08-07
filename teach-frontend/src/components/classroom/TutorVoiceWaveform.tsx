export type TutorWaveformVariant = 'active' | 'dimmed' | 'listening'

interface TutorVoiceWaveformProps {
  active?: boolean
  variant?: TutorWaveformVariant
  compact?: boolean
  className?: string
}

const BAR_COUNT = 10
const COMPACT_BAR_COUNT = 5

/** Decorative narration waveform — synced to tutor presence, not audio levels. */
export default function TutorVoiceWaveform({
  active = false,
  variant = 'active',
  compact = false,
  className = '',
}: TutorVoiceWaveformProps) {
  const count = compact ? COMPACT_BAR_COUNT : BAR_COUNT
  const resolvedVariant = active ? variant : 'dimmed'

  return (
    <div
      className={`tutor-voice-waveform tutor-voice-waveform--${resolvedVariant}${compact ? ' tutor-voice-waveform--compact' : ''}${className !== '' ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="tutor-voice-waveform-bar"
          style={{ animationDelay: `${index * 65}ms` }}
        />
      ))}
    </div>
  )
}
