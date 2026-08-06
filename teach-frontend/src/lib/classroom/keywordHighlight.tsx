import type { ReactNode } from 'react'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Wrap matching keywords in a highlight span for subtitles and concept cards. */
export function highlightKeywords(text: string, keywords: string[], className = 'teaching-kw'): ReactNode[] {
  if (keywords.length === 0 || text.trim() === '') {
    return [text]
  }

  const pattern = keywords
    .filter((keyword) => keyword.trim() !== '')
    .map((keyword) => escapeRegex(keyword))
    .join('|')

  if (pattern === '') {
    return [text]
  }

  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const isKeyword = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase())
    if (isKeyword) {
      return <mark key={`kw-${index}`} className={className}>{part}</mark>
    }
    return part
  })
}
