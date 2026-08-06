import { Flame, Star, Target } from 'lucide-react'
import Icon from '../ui/Icon'
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
    <div className={`learning-stats${compact ? ' learning-stats-compact' : ''}`}>
      <div className="learning-stat">
        <Icon icon={Star} size={14} />
        <span>{progress.xp.toLocaleString()} XP</span>
      </div>
      {progress.streak > 0 ? (
        <div className="learning-stat learning-stat-streak">
          <Icon icon={Flame} size={14} />
          <span>{progress.streak} day{progress.streak === 1 ? '' : 's'}</span>
        </div>
      ) : null}
      <div className="learning-stat learning-stat-goal">
        <Icon icon={Target} size={14} />
        <span>Daily {progress.lessonsCompletedToday}/{progress.dailyGoal}</span>
        <div className="daily-goal-bar" aria-hidden="true">
          <div className="daily-goal-fill" style={{ width: `${dailyPercent}%` }} />
        </div>
      </div>
      {sessionStep != null && sessionStep > 0 ? (
        <div className="learning-stat learning-stat-session">
          <span>Step {sessionStep}</span>
        </div>
      ) : null}
    </div>
  )
}
