import { ChevronRight } from 'lucide-react'
import LearningWhiteboard from './LearningWhiteboard'
import MentorTeachingPanel from './MentorTeachingPanel'
import Icon from '../ui/Icon'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import type { TeachingBeat } from '../../lib/classroom/teachingBeats'

interface LessonRhythmBarProps {
  lessonTitle: string
  slideCurrent: number
  slideTotal: number
  sessionProgress: number
}

export function LessonRhythmBar({
  lessonTitle,
  slideCurrent,
  slideTotal,
  sessionProgress,
}: LessonRhythmBarProps) {
  return (
    <header className="lesson-rhythm-bar">
      <div className="lesson-rhythm-meta">
        <p className="lesson-rhythm-title">{lessonTitle}</p>
        <p className="lesson-rhythm-slide">
          Moment {slideCurrent} · {slideTotal}
        </p>
      </div>
      <div
        className="lesson-rhythm-progress"
        role="progressbar"
        aria-valuenow={sessionProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="lesson-rhythm-progress-fill" style={{ width: `${sessionProgress}%` }} />
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
    <footer className="lesson-action-dock">
      <button
        type="button"
        className={`lesson-action-btn${loading ? ' is-loading' : ''}`}
        onClick={onContinue}
        disabled={disabled}
      >
        {label}
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
  keywords: string[]
  cueIndex: number
  totalCues: number
  isSpeaking: boolean
  hasStarted: boolean
  beat: TeachingBeat | null
  speechEnabled: boolean
  speechSupported: boolean
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
  keywords,
  cueIndex,
  totalCues,
  isSpeaking,
  hasStarted,
  beat,
  speechEnabled,
  speechSupported,
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
    <div className="teaching-layout">
      <section className="learning-panel" aria-label="Lesson content">
        <LearningWhiteboard elements={slideElements} slideKey={slideKey} />
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
        keywords={keywords}
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
  )
}
