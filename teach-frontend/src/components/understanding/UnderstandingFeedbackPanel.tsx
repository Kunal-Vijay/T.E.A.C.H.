import { AlertTriangle, ArrowRight, CheckCircle2, Target } from 'lucide-react'
import type { GraspLevel, RubricScore, UnderstandingFeedback } from '../../types/api.types'

const GRASP_COPY: Record<GraspLevel, { label: string; blurb: string }> = {
  solid: { label: 'Solid grasp', blurb: 'You reasoned it through and justified your answers.' },
  partial: { label: 'Partly there', blurb: 'You have the gist, with some gaps worth closing.' },
  shaky: { label: 'Needs another pass', blurb: 'Some core ideas did not come through yet.' },
}

/** Band a 0-5 score so the colour and wording match how it actually went. */
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

function RubricRow({ entry }: { entry: RubricScore }) {
  const band = scoreBand(entry.score, entry.max_score)
  const pips = Array.from({ length: entry.max_score }, (_, index) => index < entry.score)

  return (
    <li className="uc-rubric-row">
      <div className="uc-rubric-head">
        <span className="uc-rubric-label">{entry.label}</span>
        <span
          className={`uc-rubric-score uc-rubric-score--${band}`}
          aria-label={`${entry.score} out of ${entry.max_score}`}
        >
          {entry.score}
          <span className="uc-rubric-score-max">/{entry.max_score}</span>
        </span>
      </div>
      <div
        className="uc-rubric-pips"
        role="img"
        aria-label={`${entry.label}: ${entry.score} out of ${entry.max_score}`}
      >
        {pips.map((filled, index) => (
          <span
            key={index}
            className={`uc-pip${filled ? ` uc-pip--filled uc-pip--${band}` : ''}`}
          />
        ))}
      </div>
      {entry.comment !== '' ? <p className="uc-rubric-comment">{entry.comment}</p> : null}
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
    <div className={`uc-feedback-block uc-feedback-block--${tone}`}>
      <h4 className="uc-feedback-block-title">
        <Icon size={15} aria-hidden="true" />
        {title}
      </h4>
      <ul className="uc-feedback-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

interface UnderstandingFeedbackPanelProps {
  feedback: UnderstandingFeedback
}

export default function UnderstandingFeedbackPanel({ feedback }: UnderstandingFeedbackPanelProps) {
  const grasp = GRASP_COPY[feedback.grasp_level] ?? GRASP_COPY.partial
  const hasRubric = feedback.rubric.length > 0
  const isPlaceholder = feedback.model_used === 'heuristic'
  const nothingSpecific =
    feedback.understood_well.length === 0 &&
    feedback.needs_work.length === 0 &&
    feedback.misconceptions.length === 0

  return (
    <div className="uc-feedback" aria-live="polite">
      <header className="uc-feedback-header">
        <div className="uc-feedback-verdict">
          {hasRubric && !isPlaceholder ? (
            <div
              className={`uc-overall uc-overall--${feedback.grasp_level}`}
              role="img"
              aria-label={`Overall score ${feedback.overall_score} percent`}
            >
              <span className="uc-overall-value">{feedback.overall_score}</span>
              <span className="uc-overall-unit">%</span>
            </div>
          ) : null}
          <div className="uc-feedback-verdict-text">
            <span className={`uc-grasp uc-grasp--${feedback.grasp_level}`}>{grasp.label}</span>
            <p className="uc-feedback-headline">{feedback.headline}</p>
            <p className="uc-feedback-sub">
              {grasp.blurb} You answered {feedback.questions_answered} of{' '}
              {feedback.questions_asked} question
              {feedback.questions_asked === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
      </header>

      {hasRubric && !isPlaceholder ? (
        <section className="uc-rubric" aria-label="Score breakdown">
          <h3 className="uc-rubric-title">How you scored</h3>
          <ul className="uc-rubric-list">
            {feedback.rubric.map((entry) => (
              <RubricRow key={entry.key} entry={entry} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="uc-feedback-grid">
        <FeedbackList
          title="You explained this well"
          items={feedback.understood_well}
          tone="good"
          icon={CheckCircle2}
        />
        <FeedbackList
          title="Worth revisiting"
          items={feedback.needs_work}
          tone="warn"
          icon={Target}
        />
        <FeedbackList
          title="Set these straight"
          items={feedback.misconceptions}
          tone="bad"
          icon={AlertTriangle}
        />
        <FeedbackList title="Do next" items={feedback.next_steps} tone="next" icon={ArrowRight} />
      </div>

      {nothingSpecific && !isPlaceholder ? (
        <p className="uc-feedback-thin">
          There was not much to go on here. Try again and talk through your reasoning in more
          detail.
        </p>
      ) : null}
    </div>
  )
}
