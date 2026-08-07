import katex from 'katex'

export interface BoardLatexRenderResult {
  html: string
  failed: boolean
}

/**
 * Render LaTeX for whiteboard embed cards. Logs a warning and marks failure when
 * output would be invisible or empty so callers can show a readable fallback.
 */
export function renderBoardLatex(source: string): BoardLatexRenderResult {
  const content = source.trim()
  if (content === '') {
    console.warn('[LessonBoard] Empty LaTeX equation skipped')
    return { html: '', failed: true }
  }

  try {
    const html = katex.renderToString(content, { throwOnError: false, displayMode: true })
    const failed =
      html.includes('katex-error') ||
      html.trim() === '' ||
      /ParseError|Undefined control sequence/i.test(html)

    if (failed) {
      console.warn('[LessonBoard] KaTeX failed to render equation:', content)
    }

    return { html, failed }
  } catch (error) {
    console.warn('[LessonBoard] KaTeX render error:', content, error)
    return { html: '', failed: true }
  }
}
