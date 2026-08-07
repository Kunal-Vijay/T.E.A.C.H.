import { Maximize2, Minimize2 } from 'lucide-react'
import Icon from '../ui/Icon'

interface WhiteboardFullscreenControlProps {
  isFullscreen: boolean
  onToggle: () => void
}

export default function WhiteboardFullscreenControl({
  isFullscreen,
  onToggle,
}: WhiteboardFullscreenControlProps) {
  return (
    <button
      type="button"
      className={`live-session-fullscreen-btn${isFullscreen ? ' is-active' : ''}`}
      onClick={onToggle}
      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      aria-label={isFullscreen ? 'Exit fullscreen whiteboard' : 'Fullscreen whiteboard'}
    >
      <Icon icon={isFullscreen ? Minimize2 : Maximize2} size={18} strokeWidth={2} />
    </button>
  )
}
