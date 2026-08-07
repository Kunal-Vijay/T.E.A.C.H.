import { AlertTriangle, ArrowRight, CheckCircle2, Target } from 'lucide-react'
import type { GraspLevel, VivaRubricScore, VoiceVivaAssessment } from '../../types/learning.types'

const GRASP_COPY: Record<GraspLevel, { label: string; blurb: string }> = {
  solid: { label: 'Solid grasp', blurb: 'You reasoned it through and justified your answers.' },
  partial: { label: 'Partly there', blurb: 'You have the gist, with some gaps worth closing.' },
  shaky: { label: 'Needs another pass', blurb: 'Some core ideas did not come through yet.' },
}

/** Band a score so colour and wording match how it actually went. */
function scoreBand(score: number, max: number): 'strong' | 'fair' | 'weak' | 'none' {
  if (score <= 0) {
    return 'none'
  }
  const ratio = max > 0 ? score / max : 0
  if (ratio >= 0.7) {
    return 'strong'
  }
  return ratio >= 0.4 ? 'fair' : 'weak'
}

function RubricRow({ entry }: { entry: VivaRubricScore }) {
  const band = scoreBand(entry.score, entry.max_score)
  const pips = Array.from({ length: entry.max_score }, (_, index) => index < entry.score)

  return (
    <li className="viva-rubric-row">
      <div className="viva-rubric-head">
        <span className="viva-rubric-label">{entry.label}</span>
        <span className={`viva-rubric-score viva-rubric-score--${band}`}>
          {entry.score}
          <span className="viva-rubric-score-max">/{entry.max_score}</span>
        </span>
      </div>
      <div
        className="viva-rubric-pips"
        role="img"
        aria-label={`${entry.label}: ${entry.score} out of ${entry.max_score}`}
      >
        {pips.map((filled, index) => (
          <span
            key={index}
            className={`viva-pip${filled ? ` viva-pip--filled viva-pip--${band}` : ''}`}
          />
        ))}
      </div>
      {entry.comment !== '' ? <p className="viva-rubric-comment">{entry.comment}</p> : null}
    </li>
  )
}

interface FeedbackListProps {
  title: string
  items: string[]
  tone: 'good' | 'warn' | 'bad' | 'next'
  icon: typeof CheckCircle2
}

function FeedbackList({ title, items, tone, icon: Icon }: FeedbackListProps) {
  if (items.length === 0) {
    return null
  }
  return (
    <div className={`viva-feedback-block viva-feedback-block--${tone}`}>
      <h4 className="viva-feedback-block-title">
        <Icon size={15} aria-hidden="true" />
        {title}
      </h4>
      <ul className="viva-feedback-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

interface VivaAssessmentPanelProps {
  assessment: VoiceVivaAssessment
}

export default function VivaAssessmentPanel({ assessment }: VivaAssessmentPanelProps) {
  const grasp = GRASP_COPY[assessment.grasp_level] ?? GRASP_COPY.partial
  const hasRubric = assessment.rubric.length > 0
  const nothingSpecific =
    assessment.understood_well.length === 0 &&
    assessment.needs_work.length === 0 &&
    assessment.misconceptions.length === 0

  return (
    <div className="viva-assessment" aria-live="polite">
      <header className="viva-assessment-header">
        {hasRubric ? (
          <div
            className={`viva-overall viva-overall--${assessment.grasp_level}`}
            role="img"
            aria-label={`Overall score ${assessment.overall_score} percent`}
          >
            <span className="viva-overall-value">{assessment.overall_score}</span>
            <span className="viva-overall-unit">%</span>
          </div>
        ) : null}
        <div className="viva-assessment-verdict">
          <span className={`viva-grasp viva-grasp--${assessment.grasp_level}`}>{grasp.label}</span>
          <p className="viva-assessment-headline">{assessment.headline}</p>
          <p className="viva-assessment-sub">
            {grasp.blurb} You answered {assessment.questions_answered} of{' '}
            {assessment.questions_asked} question
            {assessment.questions_asked === 1 ? '' : 's'}.
          </p>
        </div>
      </header>

      {hasRubric ? (
        <section className="viva-rubric" aria-label="Score breakdown">
          <h3 className="viva-rubric-title">How you scored</h3>
          <ul className="viva-rubric-list">
            {assessment.rubric.map((entry) => (
              <RubricRow key={entry.key} entry={entry} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="viva-feedback-grid">
        <FeedbackList
          title="You explained this well"
          items={assessment.understood_well}
          tone="good"
          icon={CheckCircle2}
        />
        <FeedbackList
          title="Worth revisiting"
          items={assessment.needs_work}
          tone="warn"
          icon={Target}
        />
        <FeedbackList
          title="Set these straight"
          items={assessment.misconceptions}
          tone="bad"
          icon={AlertTriangle}
        />
        <FeedbackList title="Do next" items={assessment.next_steps} tone="next" icon={ArrowRight} />
      </div>

      {nothingSpecific ? (
        <p className="viva-assessment-thin">
          There was not much to go on here. Try again and talk through your reasoning in more
          detail.
        </p>
      ) : null}
    </div>
  )
}
