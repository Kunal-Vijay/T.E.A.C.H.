import type { InlineNode } from './types'

export function parseInlineMarkdown(text: string): InlineNode[] {
  if (text === '') {
    return []
  }

  const nodes: InlineNode[] = []
  const pattern = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_([^_]+)_|`([^`]+)`)/g
  let lastIndex = 0
  let match = pattern.exec(text)

  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    if (match[2] !== undefined || match[3] !== undefined) {
      nodes.push({ type: 'strong', value: match[2] ?? match[3] ?? '' })
    } else if (match[4] !== undefined || match[5] !== undefined) {
      nodes.push({ type: 'em', value: match[4] ?? match[5] ?? '' })
    } else if (match[6] !== undefined) {
      nodes.push({ type: 'code', value: match[6] })
    }

    lastIndex = match.index + match[0].length
    match = pattern.exec(text)
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', value: text }]
}
