import katex from 'katex'
import 'katex/dist/katex.min.css'
import LessonContent from '../lesson/LessonContent'
import { highlightKeywords } from '../../lib/classroom/keywordHighlight'
import { isSafeAssetUrl } from '../../lib/urlValidation'
import type { BeatPhase, TeachingBeat } from '../../lib/classroom/teachingBeats'

interface ConceptStageProps {
  beat: TeachingBeat | null
  hasStarted: boolean
  completedConcepts: number[]
}

function ConceptVisual({ imageUrl, caption }: { imageUrl: string; caption?: string }) {
  if (!isSafeAssetUrl(imageUrl)) {
    return <div className="concept-visual-placeholder">Visual example</div>
  }
  return (
    <figure className="concept-visual">
      <img src={imageUrl} alt={caption ?? 'Lesson visual'} loading="lazy" decoding="async" />
      {caption !== undefined && caption.trim() !== '' ? (
        <figcaption>{caption}</figcaption>
      ) : null}
    </figure>
  )
}

function ConceptLatex({ content }: { content: string }) {
  const html = katex.renderToString(content, { throwOnError: false })
  return <div className="concept-latex" dangerouslySetInnerHTML={{ __html: html }} />
}

interface ConceptStagePropsExtended extends ConceptStageProps {
  extraElements?: Array<Record<string, unknown>>
}

export default function ConceptStage({
  beat,
  hasStarted,
  completedConcepts,
  extraElements = [],
}: ConceptStagePropsExtended) {
  const phase: BeatPhase | 'idle' = beat?.phase ?? 'idle'
  const showContent = hasStarted && beat !== null

  const latexElement = extraElements.find((element) => String(element.type ?? '') === 'latex')

  return (
    <div className={`concept-stage concept-stage-${phase}${showContent ? ' is-visible' : ''}`}>
      {!showContent ? (
        <div className="concept-stage-idle">
          <span className="concept-stage-idle-pulse" aria-hidden="true" />
          <p>Your lesson begins here</p>
        </div>
      ) : null}

      {showContent && beat?.title !== undefined && beat.title.trim() !== '' && phase !== 'recap' ? (
        <p className="concept-stage-eyebrow">
          <LessonContent source={beat.title} inline />
        </p>
      ) : null}

      {showContent && (phase === 'intro') ? (
        <h2 className="concept-stage-headline concept-stage-headline-intro">
          {beat?.title !== undefined && beat.title.trim() !== ''
            ? <LessonContent source={beat.title} inline />
            : 'Let\'s begin'}
        </h2>
      ) : null}

      {showContent && (phase === 'reveal' || phase === 'explain') && beat?.conceptText !== undefined ? (
        <div className={`concept-stage-focus${phase === 'explain' ? ' is-explaining' : ''}`}>
          <span className="concept-stage-index" aria-hidden="true">
            {(beat.conceptIndex ?? 0) + 1}
          </span>
          <h2 className="concept-stage-headline">
            {phase === 'explain'
              ? highlightKeywords(beat.conceptText, beat.keywords, 'concept-kw')
              : <LessonContent source={beat.conceptText} inline />}
          </h2>
        </div>
      ) : null}

      {showContent && phase === 'visual' && beat?.imageUrl !== undefined && beat.imageUrl !== null ? (
        <ConceptVisual imageUrl={beat.imageUrl} caption={beat.conceptText} />
      ) : null}

      {showContent && phase === 'recap' && beat?.recapItems !== undefined ? (
        <div className="concept-stage-recap">
          <p className="concept-stage-recap-label">Key takeaways</p>
          <ul className="concept-stage-recap-list">
            {beat.recapItems.map((item, index) => (
              <li
                key={`recap-${index}`}
                className={`concept-stage-recap-item${completedConcepts.includes(index) ? ' is-learned' : ''}`}
              >
                <LessonContent source={item} inline />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showContent && latexElement !== undefined && (phase === 'explain' || phase === 'visual') ? (
        <ConceptLatex content={String(latexElement.content ?? '')} />
      ) : null}
    </div>
  )
}
