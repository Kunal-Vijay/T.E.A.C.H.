import LessonBoardElements from '../lesson/LessonBoardElements'

export default function SlideRenderer({ elements }: { elements: Array<Record<string, unknown>> }) {
  return (
    <article className="lesson-board lesson-board--static">
      <div className="lesson-board-inner">
        <LessonBoardElements elements={elements} />
      </div>
    </article>
  )
}
