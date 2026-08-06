import { Award } from 'lucide-react'
import Icon from '../ui/Icon'

interface AchievementToastProps {
  title: string
  description: string
}

export default function AchievementToast({ title, description }: AchievementToastProps) {
  return (
    <div className="achievement-toast">
      <Icon icon={Award} size={16} />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  )
}
