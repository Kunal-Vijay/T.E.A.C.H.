import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import ConceptStage from './ConceptStage'
import ConceptTrail from './ConceptTrail'
import LearningWhiteboard from './LearningWhiteboard'
import LessonVoicePlayer from './LessonVoicePlayer'
import MentorTeachingPanel from './MentorTeachingPanel'
import Icon from '../ui/Icon'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import type { TeachingBeat } from '../../lib/classroom/teachingBeats'
import type { TutorPresence } from '../../lib/tutor/tutorPresence'

interface LessonRhythmBarProps {
  lessonTitle: string
  slideCurrent: number
  slideTotal: number
  sessionProgress: number
  cueIndex?: number
  totalCues?: number
  tutorPresence: TutorPresence
  exitControl?: ReactNode
}

export function LessonRhythmBar({
  lessonTitle,
  slideCurrent,
  slideTotal,
  sessionProgress,
  cueIndex = 0,
  totalCues = 0,
  tutorPresence,
  exitControl,
}: LessonRhythmBarProps) {
  const mode = tutorPresence.mode
  const showCueMoment = mode === 'speaking' && totalCues > 1

  return (
    <header className={`classroom-rhythm lesson-rhythm-bar${mode === 'speaking' ? ' is-speaking' : ''}${mode === 'listening' ? ' is-listening' : ''}${mode === 'thinking' ? ' is-thinking' : ''}`}>
      <div className="classroom-rhythm-top">
        {exitControl ?? null}
        <div className="classroom-rhythm-copy lesson-rhythm-meta">
          <p className="classroom-rhythm-kicker">Live lesson</p>
          <h2 className="classroom-rhythm-title lesson-rhythm-title">{lessonTitle}</h2>
        </div>
        <div className={`classroom-rhythm-badge classroom-rhythm-badge--${mode}`} aria-hidden="true">
          {mode === 'speaking' ? <span className="classroom-rhythm-speaking-dot" /> : null}
          {mode === 'listening' ? <span className="classroom-rhythm-listening-dot" /> : null}
          {mode === 'thinking' ? <span className="classroom-rhythm-thinking-dot" /> : null}
          {mode === 'speaking' || mode === 'listening' || mode === 'thinking' ? null : (
            <span className="classroom-rhythm-live-dot" />
          )}
          {mode === 'speaking' ? 'Speaking' : mode === 'listening' ? 'Listening' : mode === 'thinking' ? 'Thinking' : 'Live'}
        </div>
        <p className="classroom-rhythm-moment lesson-rhythm-slide">
          {showCueMoment ? (
            <>
              Moment <span className="classroom-rhythm-moment-current">{cueIndex + 1}</span>
              <span className="classroom-rhythm-moment-sep">/</span>
              {totalCues}
            </>
          ) : (
            <>
              Slide <span className="classroom-rhythm-moment-current">{slideCurrent}</span>
              <span className="classroom-rhythm-moment-sep">/</span>
              {slideTotal}
            </>
          )}
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
          className={`classroom-rhythm-fill lesson-rhythm-progress-fill${mode === 'speaking' ? ' is-active' : ''}`}
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
  isTalking?: boolean
  slideElements: Array<Record<string, unknown>>
  slideKey: string | number
  currentCue: string
  previousCue: string
  cueIndex: number
  totalCues: number
  showSpeaking: boolean
  tutorPresence: TutorPresence
  hasStarted: boolean
  beat: TeachingBeat | null
  beats: TeachingBeat[]
  conceptLabels: string[]
  completedConcepts: number[]
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
  isTalking = false,
  slideElements,
  slideKey,
  currentCue,
  previousCue,
  cueIndex,
  totalCues,
  showSpeaking,
  tutorPresence,
  hasStarted,
  beat,
  beats,
  conceptLabels,
  completedConcepts,
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
  const useConceptStage = hasStarted && beats.length > 0
  const activeConceptIndex = beat?.conceptIndex ?? null

  return (
    <div className={`classroom-stage${showSpeaking ? ' is-tutor-speaking' : ''}${tutorPresence.mode === 'listening' ? ' is-tutor-listening' : ''}${tutorPresence.mode === 'thinking' ? ' is-tutor-thinking' : ''}`}>
      <div className="classroom-grid teaching-layout">
        <section className="classroom-learn learning-panel" aria-label="Lesson content">
          {conceptLabels.length > 1 ? (
            <ConceptTrail
              labels={conceptLabels}
              activeIndex={activeConceptIndex}
              completedConcepts={completedConcepts}
            />
          ) : null}
          <div className="classroom-learn-body">
            {useConceptStage ? (
              <ConceptStage
                key={beat?.id ?? slideKey}
                beat={beat}
                hasStarted={hasStarted}
                completedConcepts={completedConcepts}
                extraElements={slideElements}
              />
            ) : (
              <LearningWhiteboard elements={slideElements} slideKey={slideKey} />
            )}
            <LessonVoicePlayer
              speechSupported={speechSupported}
              speechEnabled={speechEnabled}
              showSpeaking={showSpeaking}
              tutorPresence={tutorPresence}
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
          isTalking={isTalking}
          currentCue={currentCue}
          previousCue={previousCue}
          cueIndex={cueIndex}
          totalCues={totalCues}
          showSpeaking={showSpeaking}
          tutorPresence={tutorPresence}
          hasStarted={hasStarted}
          beatPhase={beat?.phase}
          highlightWords={beat?.keywords ?? []}
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
