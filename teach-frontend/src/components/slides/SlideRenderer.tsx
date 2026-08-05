import katex from 'katex'
import 'katex/dist/katex.min.css'

interface SlideElementProps {
  element: Record<string, unknown>
}

function SlideElementText({ element }: SlideElementProps) {
  const content = String(element.content ?? '')
  const elementType = String(element.type ?? 'text')
  if (elementType === 'heading') {
    return <h2>{content}</h2>
  }
  if (elementType === 'bullet_list' && Array.isArray(element.content)) {
    return (
      <ul>
        {element.content.map((item, index) => (
          <li key={`bullet-${index}`}>{String(item)}</li>
        ))}
      </ul>
    )
  }
  return <p>{content}</p>
}

function SlideElementLatex({ element }: SlideElementProps) {
  const html = katex.renderToString(String(element.content ?? ''), { throwOnError: false })
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function SlideElementImage({ element }: SlideElementProps) {
  const assetUrl = element.asset_url !== null && element.asset_url !== undefined ? String(element.asset_url) : null
  if (assetUrl === null || assetUrl === '') {
    return <div className="image-placeholder">Diagram</div>
  }
  return <img src={assetUrl} alt="Slide visual" />
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
      <style>{`
        .slide-renderer { display: flex; flex-direction: column; gap: 1rem; font-size: 1.1rem; line-height: 1.6; }
        .image-placeholder { height: 180px; border-radius: 12px; background: #eff6ff; display: grid; place-items: center; color: var(--teach-muted); }
        .slide-renderer img { max-width: 100%; border-radius: 12px; }
      `}</style>
    </div>
  )
}
