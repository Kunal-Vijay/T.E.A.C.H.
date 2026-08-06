import { LayoutGrid } from 'lucide-react'
import LessonBoardElements from '../lesson/LessonBoardElements'
import Icon from '../ui/Icon'

interface LearningWhiteboardProps {
  elements: Array<Record<string, unknown>>
  /** Changes on slide navigation — triggers a single board entrance animation. */
  slideKey: string | number
}

export default function LearningWhiteboard({ elements, slideKey }: LearningWhiteboardProps) {
  const isEmpty = elements.length === 0

  return (
    <div className="learning-whiteboard lesson-whiteboard is-live">
      <div className="lesson-whiteboard-shell">
        <div className="lesson-board-surface" aria-hidden="true" />
        <div className="lesson-whiteboard-glow" aria-hidden="true" />

        {isEmpty ? (
          <div className="lesson-whiteboard-idle whiteboard-idle">
            <div className="lesson-whiteboard-idle-mark" aria-hidden="true">
              <Icon icon={LayoutGrid} size={28} strokeWidth={1.5} />
            </div>
            <p className="lesson-whiteboard-idle-title">Your lesson board is ready</p>
            <p className="lesson-whiteboard-idle-hint whiteboard-idle-text">
              Key points, diagrams, and formulas appear here as your AI Tutor teaches.
            </p>
          </div>
        ) : (
          <article key={slideKey} className="lesson-board" aria-label="Lesson content">
            <div className="lesson-board-inner">
              <LessonBoardElements elements={elements} />
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
