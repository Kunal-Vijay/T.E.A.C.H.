import { AlertCircle, Volume2, VolumeX } from 'lucide-react'
import Icon from '../ui/Icon'

interface LessonVoiceWaveformProps {
  active?: boolean
}

const WAVEFORM_BARS = 10

function LessonVoiceWaveform({ active = false }: LessonVoiceWaveformProps) {
  return (
    <div
      className={`lesson-voice-waveform${active ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: WAVEFORM_BARS }, (_, index) => (
        <span
          key={index}
          className="lesson-voice-waveform-bar"
          style={{ animationDelay: `${index * 65}ms` }}
        />
      ))}
    </div>
  )
}

export interface LessonVoicePlayerProps {
  speechSupported: boolean
  speechEnabled: boolean
  isSpeaking: boolean
  hasStarted: boolean
  playbackComplete: boolean
  cueIndex: number
  totalCues: number
  speechError: string | null
  onEnableSpeech: () => void
}

function voicePlayerStatusLabel(
  speechEnabled: boolean,
  isSpeaking: boolean,
  hasStarted: boolean,
  playbackComplete: boolean,
) {
  if (!speechEnabled) {
    return hasStarted ? 'Manual pace' : 'Voice off'
  }
  if (isSpeaking) {
    return 'Speaking'
  }
  if (playbackComplete) {
    return 'Narration complete'
  }
  if (hasStarted) {
    return 'Standby'
  }
  return 'Voice ready'
}

export default function LessonVoicePlayer({
  speechSupported,
  speechEnabled,
  isSpeaking,
  hasStarted,
  playbackComplete,
  cueIndex,
  totalCues,
  speechError,
  onEnableSpeech,
}: LessonVoicePlayerProps) {
  if (speechError !== null) {
    return (
      <div className="lesson-voice-player lesson-voice-player--error" role="alert">
        <Icon icon={AlertCircle} size={18} className="lesson-voice-player-error-icon" />
        <div className="lesson-voice-player-error-copy">
          <p className="lesson-voice-player-error-title">Voice playback issue</p>
          <p className="lesson-voice-player-error-message">{speechError}</p>
        </div>
      </div>
    )
  }

  if (!speechSupported) {
    return (
      <div className="lesson-voice-player lesson-voice-player--unsupported">
        <Icon icon={VolumeX} size={18} className="lesson-voice-player-icon" />
        <div className="lesson-voice-player-copy">
          <p className="lesson-voice-player-title">Voice unavailable</p>
          <p className="lesson-voice-player-hint">Use Continue to move through the lesson at your own pace.</p>
        </div>
      </div>
    )
  }

  if (!speechEnabled) {
    return (
      <div className="lesson-voice-player lesson-voice-player--prompt">
        <div className="lesson-voice-player-prompt-mark" aria-hidden="true">
          <Icon icon={Volume2} size={20} strokeWidth={1.75} />
        </div>
        <div className="lesson-voice-player-copy">
          <p className="lesson-voice-player-title">Hear your AI Tutor teach this moment</p>
          <p className="lesson-voice-player-hint">
            Turn on voice for synced narration — or tap Begin to read at your pace.
          </p>
        </div>
        <button type="button" className="lesson-voice-player-enable" onClick={onEnableSpeech}>
          Enable voice
        </button>
      </div>
    )
  }

  const statusLabel = voicePlayerStatusLabel(speechEnabled, isSpeaking, hasStarted, playbackComplete)
  const cueProgress = totalCues > 0 ? ((cueIndex + 1) / totalCues) * 100 : 0

  return (
    <div
      className={`lesson-voice-player${isSpeaking ? ' is-speaking' : ''}${playbackComplete ? ' is-complete' : ''}`}
      aria-live="polite"
    >
      <div className="lesson-voice-player-main">
        <div className="lesson-voice-player-status">
          {isSpeaking ? (
            <LessonVoiceWaveform active />
          ) : (
            <span className="lesson-voice-player-icon-wrap" aria-hidden="true">
              <Icon icon={Volume2} size={18} />
            </span>
          )}
          <span className="lesson-voice-player-status-label">{statusLabel}</span>
        </div>

        {totalCues > 1 ? (
          <div className="lesson-voice-player-progress">
            <div className="lesson-voice-player-progress-meta">
              <span className="lesson-voice-player-cue">
                Cue {cueIndex + 1} of {totalCues}
              </span>
            </div>
            <div
              className="lesson-voice-player-track"
              role="progressbar"
              aria-valuenow={Math.round(cueProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Narration progress for this moment"
            >
              <div
                className="lesson-voice-player-fill"
                style={{ width: `${cueProgress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
