import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Check } from 'lucide-react'
import Icon from '../ui/Icon'
import LessonContent from './LessonContent'
import { normalizeBulletItems } from '../../lib/classroom/lessonPlayback'
import { isSafeAssetUrl } from '../../lib/urlValidation'

interface LessonBoardElementsProps {
  elements: Array<Record<string, unknown>>
}

/** Renders slide elements[] as a stable lesson board — independent of narration. */
export default function LessonBoardElements({ elements }: LessonBoardElementsProps) {
  return (
    <>
      {elements.map((element, index) => {
        const elementType = String(element.type ?? 'text')

        if (elementType === 'heading') {
          return (
            <h2 key={`lb-heading-${index}`} className="lesson-board-heading">
              <LessonContent source={String(element.content ?? '')} inline />
            </h2>
          )
        }

        if (elementType === 'bullet_list') {
          const items = normalizeBulletItems(element.content)
          if (items.length === 0) {
            return null
          }

          return (
            <ul
              key={`lb-bullets-${index}`}
              className="lesson-board-bullets"
              aria-label="Key points"
            >
              {items.map((item, itemIndex) => (
                <li key={`lb-bullet-${index}-${itemIndex}`} className="lesson-board-bullet">
                  <span className="lesson-board-bullet-icon" aria-hidden="true">
                    <Icon icon={Check} size={16} strokeWidth={2.5} />
                  </span>
                  <span className="lesson-board-bullet-body">
                    <LessonContent source={item} inline />
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (elementType === 'image') {
          const assetUrl = element.asset_url !== null && element.asset_url !== undefined
            ? String(element.asset_url)
            : null
          return (
            <figure key={`lb-image-${index}`} className="lesson-board-visual">
              {assetUrl !== null && assetUrl !== '' && isSafeAssetUrl(assetUrl) ? (
                <img src={assetUrl} alt="Lesson visual" loading="lazy" decoding="async" />
              ) : (
                <div className="lesson-board-visual-placeholder">Diagram</div>
              )}
            </figure>
          )
        }

        if (elementType === 'latex') {
          const html = katex.renderToString(String(element.content ?? ''), { throwOnError: false })
          return (
            <div
              key={`lb-latex-${index}`}
              className="lesson-board-formula"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }

        return (
          <div key={`lb-text-${index}`} className="lesson-board-text">
            <LessonContent source={String(element.content ?? '')} />
          </div>
        )
      })}
    </>
  )
}
