interface VoiceWaveformProps {
  active?: boolean
}

const BARS = 12

export default function VoiceWaveform({ active = false }: VoiceWaveformProps) {
  return (
    <div
      className={`voice-waveform${active ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: BARS }, (_, index) => (
        <span
          key={index}
          className="voice-waveform-bar"
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  )
}
