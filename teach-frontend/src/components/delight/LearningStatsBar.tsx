import { Flame, Star, Target } from 'lucide-react'
import Icon from '../ui/Icon'
import ProgressBar from '../ui/ProgressBar'
import { useLearningProgress } from '../../context/LearningProgressContext'

interface LearningStatsBarProps {
  compact?: boolean
  sessionStep?: number
}

export default function LearningStatsBar({ compact = false, sessionStep }: LearningStatsBarProps) {
  const { progress } = useLearningProgress()
  const dailyPercent = Math.min(
    100,
    Math.round((progress.lessonsCompletedToday / progress.dailyGoal) * 100),
  )

  return (
    <div
      className={`learning-stats${compact ? ' learning-stats-compact' : ''}`}
      role="region"
      aria-label="Your learning progress"
    >
      <div className="learning-stat-pill learning-stat-pill--xp">
        <span className="learning-stat-icon" aria-hidden="true">
          <Icon icon={Star} size={15} />
        </span>
        <span className="learning-stat-body">
          <span className="learning-stat-value">{progress.xp.toLocaleString()}</span>
          <span className="learning-stat-label">XP</span>
        </span>
      </div>

      {progress.streak > 0 ? (
        <div className="learning-stat-pill learning-stat-pill--streak">
          <span className="learning-stat-icon" aria-hidden="true">
            <Icon icon={Flame} size={15} />
          </span>
          <span className="learning-stat-body">
            <span className="learning-stat-value">{progress.streak}</span>
            <span className="learning-stat-label">day streak</span>
          </span>
        </div>
      ) : null}

      <div className="learning-stat-pill learning-stat-pill--goal">
        <span className="learning-stat-icon" aria-hidden="true">
          <Icon icon={Target} size={15} />
        </span>
        <span className="learning-stat-body learning-stat-body--goal">
          <span className="learning-stat-value">
            {progress.lessonsCompletedToday}/{progress.dailyGoal}
          </span>
          <span className="learning-stat-label">daily goal</span>
          <ProgressBar
            variant="goal"
            value={dailyPercent}
            aria-label="Daily goal progress"
          />
        </span>
      </div>

      {sessionStep != null && sessionStep > 0 ? (
        <div className="learning-stat-pill learning-stat-pill--session">
          <span className="learning-stat-body">
            <span className="learning-stat-value">Step {sessionStep}</span>
            <span className="learning-stat-label">in session</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}
