import { ArrowLeft, Sparkles, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import type { SessionSummary } from '../../services/learningProgress'

interface SessionCompleteScreenProps {
  summary: SessionSummary
  classTitle?: string
  onClose: () => void
}

export default function SessionCompleteScreen({
  summary,
  classTitle,
  onClose,
}: SessionCompleteScreenProps) {
  const quizPercent = summary.quizTotal > 0
    ? Math.round((summary.quizCorrect / summary.quizTotal) * 100)
    : null

  return (
    <div className="session-complete-screen">
      <div className="session-complete-card card">
        <div className="session-complete-badge" aria-hidden="true">
          <Icon icon={Trophy} size={28} />
        </div>
        <p className="session-complete-kicker">Course complete</p>
        <h2 className="session-complete-title">
          {classTitle ?? 'You finished the class'}
        </h2>
        <p className="session-complete-lede">
          That’s the full journey — slides, quizzes, and doubts included. Take a breath; you earned this.
        </p>

        <div className="session-summary-grid">
          <div className="session-summary-stat session-summary-stat-highlight">
            <strong>+{summary.xpEarned}</strong>
            <span>XP earned</span>
          </div>
          <div className="session-summary-stat">
            <strong>{summary.statesCompleted}</strong>
            <span>moments completed</span>
          </div>
          {summary.quizTotal > 0 ? (
            <div className="session-summary-stat">
              <strong>{summary.quizCorrect}/{summary.quizTotal}</strong>
              <span>quiz{summary.quizTotal === 1 ? '' : 'zes'} correct</span>
            </div>
          ) : null}
          {quizPercent !== null ? (
            <div className="session-summary-stat">
              <strong>{quizPercent}%</strong>
              <span>quiz accuracy</span>
            </div>
          ) : null}
          {summary.sageQuestions > 0 ? (
            <div className="session-summary-stat">
              <strong>{summary.sageQuestions}</strong>
              <span>SAGE questions</span>
            </div>
          ) : null}
        </div>

        <div className="session-complete-actions">
          <Link to="/student" className="btn btn-primary btn-with-icon" onClick={onClose}>
            <Icon icon={ArrowLeft} size={16} />
            Back to classes
          </Link>
          <button type="button" className="btn btn-ghost btn-with-icon" onClick={onClose}>
            <Icon icon={Sparkles} size={16} />
            Review summary
          </button>
        </div>
      </div>
    </div>
  )
}
