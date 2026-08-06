import katex from 'katex'
import 'katex/dist/katex.min.css'
import LessonContent from '../lesson/LessonContent'
import { isSafeAssetUrl } from '../../lib/urlValidation'

interface SlideElementProps {
  element: Record<string, unknown>
}

function normalizeBulletItems(content: unknown): string[] {
  if (Array.isArray(content)) {
    return content.map((item) => String(item))
  }
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item))
        }
      } catch {
        /* fall through */
      }
    }
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
  }
  return []
}

function SlideElementText({ element }: SlideElementProps) {
  const content = element.content
  const elementType = String(element.type ?? 'text')

  if (elementType === 'heading') {
    return (
      <h2 className="lesson-heading">
        <LessonContent source={String(content ?? '')} inline />
      </h2>
    )
  }

  if (elementType === 'bullet_list') {
    const items = normalizeBulletItems(content)
    return (
      <ul className="lesson-list">
        {items.map((item, index) => (
          <li key={`bullet-${index}`}>
            <LessonContent source={item} inline />
          </li>
        ))}
      </ul>
    )
  }

  return <LessonContent source={String(content ?? '')} />
}

function SlideElementLatex({ element }: SlideElementProps) {
  const html = katex.renderToString(String(element.content ?? ''), { throwOnError: false })
  return <div className="lesson-formula" dangerouslySetInnerHTML={{ __html: html }} />
}

function SlideElementImage({ element }: SlideElementProps) {
  const assetUrl = element.asset_url !== null && element.asset_url !== undefined ? String(element.asset_url) : null
  if (assetUrl === null || assetUrl === '' || !isSafeAssetUrl(assetUrl)) {
    return <div className="image-placeholder">Diagram</div>
  }
  return <img src={assetUrl} alt="Slide visual" loading="lazy" decoding="async" />
}

export default function SlideRenderer({ elements }: { elements: Array<Record<string, unknown>> }) {
  return (
    <div className="slide-renderer">
      {elements.map((element, index) => {
        const elementType = String(element.type ?? 'text')
        if (elementType === 'latex') {
          return <SlideElementLatex key={`element-${index}`} element={element} />
        }
        if (elementType === 'image') {
          return <SlideElementImage key={`element-${index}`} element={element} />
        }
        return <SlideElementText key={`element-${index}`} element={element} />
      })}
    </div>
  )
}
