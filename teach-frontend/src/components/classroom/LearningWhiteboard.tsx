import LessonBoardElements from '../lesson/LessonBoardElements'

interface LearningWhiteboardProps {
  elements: Array<Record<string, unknown>>
  /** Changes on slide navigation — triggers a single board entrance animation. */
  slideKey: string | number
}

export default function LearningWhiteboard({ elements, slideKey }: LearningWhiteboardProps) {
  const isEmpty = elements.length === 0

  return (
    <div className="learning-whiteboard is-live">
      <div className="lesson-board-surface" aria-hidden="true" />

      {isEmpty ? (
        <div className="whiteboard-idle">
          <p className="whiteboard-idle-text">Lesson content will appear here</p>
        </div>
      ) : (
        <article key={slideKey} className="lesson-board" aria-label="Lesson content">
          <div className="lesson-board-inner">
            <LessonBoardElements elements={elements} />
          </div>
        </article>
      )}
    </div>
  )
}
