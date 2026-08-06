import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import LearningWhiteboard from './LearningWhiteboard'
import LessonVoicePlayer from './LessonVoicePlayer'
import MentorTeachingPanel from './MentorTeachingPanel'
import Icon from '../ui/Icon'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import type { TeachingBeat } from '../../lib/classroom/teachingBeats'

interface LessonRhythmBarProps {
  lessonTitle: string
  slideCurrent: number
  slideTotal: number
  sessionProgress: number
  exitControl?: ReactNode
}

export function LessonRhythmBar({
  lessonTitle,
  slideCurrent,
  slideTotal,
  sessionProgress,
  exitControl,
}: LessonRhythmBarProps) {
  return (
    <header className="classroom-rhythm lesson-rhythm-bar">
      <div className="classroom-rhythm-top">
        {exitControl ?? null}
        <div className="classroom-rhythm-copy lesson-rhythm-meta">
          <p className="classroom-rhythm-kicker">Live lesson</p>
          <h2 className="classroom-rhythm-title lesson-rhythm-title">{lessonTitle}</h2>
        </div>
        <div className="classroom-rhythm-badge" aria-hidden="true">
          <span className="classroom-rhythm-live-dot" />
          Live
        </div>
        <p className="classroom-rhythm-moment lesson-rhythm-slide">
          Moment <span className="classroom-rhythm-moment-current">{slideCurrent}</span>
          <span className="classroom-rhythm-moment-sep">/</span>
          {slideTotal}
        </p>
      </div>
      <div
        className="classroom-rhythm-track lesson-rhythm-progress"
        role="progressbar"
        aria-valuenow={sessionProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson progress"
      >
        <div
          className="classroom-rhythm-fill lesson-rhythm-progress-fill"
          style={{ width: `${sessionProgress}%` }}
        />
      </div>
    </header>
  )
}

interface LessonActionDockProps {
  label: string
  disabled: boolean
  loading: boolean
  onContinue: () => void
}

export function LessonActionDock({ label, disabled, loading, onContinue }: LessonActionDockProps) {
  return (
    <footer className="classroom-action-dock lesson-action-dock">
      <button
        type="button"
        className={`classroom-action-btn lesson-action-btn${loading ? ' is-loading' : ''}`}
        onClick={onContinue}
        disabled={disabled}
      >
        <span>{label}</span>
        <Icon icon={ChevronRight} size={18} />
      </button>
    </footer>
  )
}

interface TeachingLayoutProps {
  mentor: MentorDefinition
  expression: ExpressionState
  slideElements: Array<Record<string, unknown>>
  slideKey: string | number
  currentCue: string
  previousCue: string
  cueIndex: number
  totalCues: number
  isSpeaking: boolean
  hasStarted: boolean
  beat: TeachingBeat | null
  speechEnabled: boolean
  speechSupported: boolean
  speechError: string | null
  playbackComplete: boolean
  onEnableSpeech: () => void
  onToggleSpeech: () => void
  onReplay: () => void
  canReplay: boolean
  continueLabel: string
  continueDisabled: boolean
  continueLoading: boolean
  onContinue: () => void
  showContinue: boolean
}

export function TeachingLayout({
  mentor,
  expression,
  slideElements,
  slideKey,
  currentCue,
  previousCue,
  cueIndex,
  totalCues,
  isSpeaking,
  hasStarted,
  beat,
  speechEnabled,
  speechSupported,
  speechError,
  playbackComplete,
  onEnableSpeech,
  onToggleSpeech,
  onReplay,
  canReplay,
  continueLabel,
  continueDisabled,
  continueLoading,
  onContinue,
  showContinue,
}: TeachingLayoutProps) {
  return (
    <div className="classroom-stage">
      <div className="classroom-grid teaching-layout">
        <section className="classroom-learn learning-panel" aria-label="Lesson content">
          <div className="classroom-learn-body">
            <LearningWhiteboard elements={slideElements} slideKey={slideKey} />
            <LessonVoicePlayer
              speechSupported={speechSupported}
              speechEnabled={speechEnabled}
              isSpeaking={isSpeaking}
              hasStarted={hasStarted}
              playbackComplete={playbackComplete}
              cueIndex={cueIndex}
              totalCues={totalCues}
              speechError={speechError}
              onEnableSpeech={onEnableSpeech}
            />
          </div>
          {showContinue ? (
            <LessonActionDock
              label={continueLabel}
              disabled={continueDisabled}
              loading={continueLoading}
              onContinue={onContinue}
            />
          ) : null}
        </section>

        <MentorTeachingPanel
          mentor={mentor}
          expression={expression}
          currentCue={currentCue}
          previousCue={previousCue}
          cueIndex={cueIndex}
          totalCues={totalCues}
          isSpeaking={isSpeaking}
          hasStarted={hasStarted}
          beatPhase={beat?.phase}
          speechEnabled={speechEnabled}
          speechSupported={speechSupported}
          onToggleSpeech={onToggleSpeech}
          onReplay={onReplay}
          canReplay={canReplay}
        />
      </div>
    </div>
  )
}
