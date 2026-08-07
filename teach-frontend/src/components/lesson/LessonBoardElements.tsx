import 'katex/dist/katex.min.css'
import { Check } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import Icon from '../ui/Icon'
import LessonContent from './LessonContent'
import { normalizeBulletItems } from '../../lib/classroom/lessonPlayback'
import { renderBoardLatex } from '../../lib/lessonContent/renderBoardLatex'
import { isSafeAssetUrl } from '../../lib/urlValidation'

interface LessonBoardElementsProps {
  elements: Array<Record<string, unknown>>
  variant?: 'default' | 'marker'
}

function writeStyle(writeIndex: number): CSSProperties {
  return { '--write-index': writeIndex } as CSSProperties
}

function renderLatexCard(content: string): ReactNode {
  const { html, failed } = renderBoardLatex(content)

  if (failed) {
    return (
      <div className="lesson-board-embed-card lesson-board-formula lesson-board-embed-card--fallback">
        <p className="lesson-board-embed-fallback-label">Equation</p>
        <pre className="lesson-board-embed-fallback">{content.trim() || 'Unable to render equation'}</pre>
      </div>
    )
  }

  return (
    <div
      className="lesson-board-embed-card lesson-board-formula"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function renderImageFigure(element: Record<string, unknown>): ReactNode {
  const assetUrl = element.asset_url !== null && element.asset_url !== undefined
    ? String(element.asset_url)
    : null

  return (
    <figure className="lesson-board-embed-card lesson-board-visual">
      {assetUrl !== null && assetUrl !== '' && isSafeAssetUrl(assetUrl) ? (
        <img src={assetUrl} alt="Lesson visual" loading="lazy" decoding="async" />
      ) : (
        <div className="lesson-board-visual-placeholder">Diagram</div>
      )}
    </figure>
  )
}

export default function LessonBoardElements({
  elements,
  variant = 'default',
}: LessonBoardElementsProps) {
  const isMarker = variant === 'marker'

  if (isMarker === false) {
    return <>{renderDefaultElements(elements)}</>
  }

  return <>{renderMarkerElements(elements)}</>
}

function renderMarkerElements(elements: Array<Record<string, unknown>>): ReactNode[] {
  let writeIndex = 0
  const nodes: ReactNode[] = []

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index]
    const elementType = String(element.type ?? 'text')

    if (elementType === 'heading') {
      const headingWriteIndex = writeIndex
      writeIndex += 1
      nodes.push(
        <div
          key={`lb-heading-${index}`}
          className="lesson-board-block lesson-board-block--heading is-marker"
        >
          <h2
            className="lesson-board-heading is-writing-in"
            style={writeStyle(headingWriteIndex)}
          >
            <span className="khan-write-ink">
              <LessonContent source={String(element.content ?? '')} inline />
            </span>
            <span className="khan-chalk-tip" aria-hidden="true" />
          </h2>
        </div>,
      )
      continue
    }

    if (elementType === 'bullet_list') {
      const items = normalizeBulletItems(element.content)
      if (items.length === 0) {
        continue
      }
      const lineNodes = items.map((item, itemIndex) => {
        const lineWriteIndex = writeIndex + itemIndex
        return (
          <p
            key={`lb-line-${index}-${itemIndex}`}
            className="lesson-board-marker-line is-writing-in"
            style={writeStyle(lineWriteIndex)}
          >
            <span className="khan-write-ink">
              <LessonContent source={item} inline />
            </span>
            <span className="khan-chalk-tip" aria-hidden="true" />
          </p>
        )
      })
      writeIndex += items.length
      nodes.push(
        <div
          key={`lb-bullets-${index}`}
          className="lesson-board-block lesson-board-block--marker-lines"
        >
          {lineNodes}
        </div>,
      )
      continue
    }

    if (elementType === 'image') {
      const imageWriteIndex = writeIndex
      writeIndex += 1
      nodes.push(
        <div
          key={`lb-image-${index}`}
          className="lesson-board-block lesson-board-block--visual is-fading-in"
          style={writeStyle(imageWriteIndex)}
        >
          {renderImageFigure(element)}
        </div>,
      )
      continue
    }

    if (elementType === 'latex') {
      const formulaWriteIndex = writeIndex
      writeIndex += 1
      nodes.push(
        <div
          key={`lb-latex-${index}`}
          className="lesson-board-block lesson-board-block--formula is-marker is-fading-in"
          style={writeStyle(formulaWriteIndex)}
        >
          {renderLatexCard(String(element.content ?? ''))}
        </div>,
      )
      continue
    }

    const textSource = String(element.content ?? '')
    const textLines = splitBoardLines(textSource)
    const lineNodes = textLines.map((line, lineIndex) => {
      const lineWriteIndex = writeIndex + lineIndex
      return (
        <div
          key={`lb-text-${index}-${lineIndex}`}
          className="lesson-board-text is-writing-in"
          style={writeStyle(lineWriteIndex)}
        >
          <span className="khan-write-ink">
            <LessonContent source={line} />
          </span>
          <span className="khan-chalk-tip" aria-hidden="true" />
        </div>
      )
    })
    writeIndex += textLines.length
    nodes.push(
      <div
        key={`lb-text-${index}`}
        className="lesson-board-block lesson-board-block--text is-marker"
      >
        {lineNodes}
      </div>,
    )
  }

  return nodes
}

function splitBoardLines(source: string): string[] {
  const lines = source
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
  if (lines.length === 0) {
    return [source]
  }
  return lines
}

function renderDefaultElements(elements: Array<Record<string, unknown>>): ReactNode[] {
  return elements.map((element, index) => {
    const elementType = String(element.type ?? 'text')

    if (elementType === 'heading') {
      return (
        <div
          key={`lb-heading-${index}`}
          className="lesson-board-block lesson-board-block--heading"
        >
          <h2 className="lesson-board-heading">
            <LessonContent source={String(element.content ?? '')} inline />
          </h2>
        </div>
      )
    }

    if (elementType === 'bullet_list') {
      const items = normalizeBulletItems(element.content)
      if (items.length === 0) {
        return null
      }

      return (
        <div key={`lb-bullets-${index}`} className="lesson-board-block lesson-board-block--bullets">
          <ul className="lesson-board-bullets" aria-label="Key points">
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
        </div>
      )
    }

    if (elementType === 'image') {
      return (
        <div key={`lb-image-${index}`} className="lesson-board-block lesson-board-block--visual">
          {renderImageFigure(element)}
        </div>
      )
    }

    if (elementType === 'latex') {
      return (
        <div
          key={`lb-latex-${index}`}
          className="lesson-board-block lesson-board-block--formula"
        >
          {renderLatexCard(String(element.content ?? ''))}
        </div>
      )
    }

    return (
      <div
        key={`lb-text-${index}`}
        className="lesson-board-block lesson-board-block--text"
      >
        <div className="lesson-board-text">
          <LessonContent source={String(element.content ?? '')} />
        </div>
      </div>
    )
  })
}
