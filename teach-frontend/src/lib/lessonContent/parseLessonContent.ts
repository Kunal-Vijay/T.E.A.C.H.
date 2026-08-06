import {
  BULLET_LINE,
  CALLOUT_INLINE,
  CALLOUT_LABEL_ONLY,
  calloutVariantFromLabel,
  LETTER_SECTION,
  MARKDOWN_BLOCKQUOTE,
  MARKDOWN_HEADING,
  MARKDOWN_HR,
  NUMBER_SECTION,
  ORDERED_LINE,
  ORDERED_SENTENCE,
  ORDERED_TOPIC,
  TOPIC_HEADING,
} from './patterns'
import type { LessonBlock } from './types'

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableDivider(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line.trim())
}

function flushParagraph(lines: string[], blocks: LessonBlock[]): void {
  const text = lines.join(' ').trim()
  if (text !== '') {
    blocks.push({ type: 'paragraph', text })
  }
  lines.length = 0
}

function flushList(
  items: string[],
  ordered: boolean,
  blocks: LessonBlock[],
): void {
  if (items.length > 0) {
    blocks.push({ type: 'list', ordered, items: [...items] })
    items.length = 0
  }
}

function pushSectionHeading(text: string, blocks: LessonBlock[]): void {
  blocks.push({ type: 'heading', level: 3, text: text.replace(/:$/, '').trim() })
}

function pushCallout(
  label: string,
  body: string,
  blocks: LessonBlock[],
): void {
  blocks.push({
    type: 'callout',
    variant: calloutVariantFromLabel(label),
    label: label.trim(),
    body: body.trim(),
  })
}

export function parseLessonContent(raw: string): LessonBlock[] {
  const normalized = raw.replace(/\r\n/g, '\n').trim()
  if (normalized === '') {
    return []
  }

  const blocks: LessonBlock[] = []
  const lines = normalized.split('\n')

  let index = 0
  let paragraphBuffer: string[] = []
  let bulletItems: string[] = []
  let orderedItems: string[] = []

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)

      const language = trimmed.slice(3).trim()
      index += 1
      const codeLines: string[] = []
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      blocks.push({
        type: 'code',
        code: codeLines.join('\n'),
        language: language !== '' ? language : undefined,
      })
      index += 1
      continue
    }

    if (
      trimmed.includes('|')
      && index + 1 < lines.length
      && isTableDivider(lines[index + 1].trim())
    ) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)

      const rows = [splitTableRow(trimmed)]
      index += 2
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitTableRow(lines[index].trim()))
        index += 1
      }
      blocks.push({ type: 'table', rows })
      continue
    }

    if (trimmed === '') {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      index += 1
      continue
    }

    const headingMatch = MARKDOWN_HEADING.exec(trimmed)
    if (headingMatch !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      const level = Math.min(headingMatch[1].length + 1, 4) as 2 | 3 | 4
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() })
      index += 1
      continue
    }

    if (MARKDOWN_HR.test(trimmed)) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    const blockquoteMatch = MARKDOWN_BLOCKQUOTE.exec(trimmed)
    if (blockquoteMatch !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      blocks.push({ type: 'blockquote', text: blockquoteMatch[1].trim() })
      index += 1
      continue
    }

    const calloutInline = CALLOUT_INLINE.exec(trimmed)
    if (calloutInline !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      pushCallout(calloutInline[1], calloutInline[2], blocks)
      index += 1
      continue
    }

    if (CALLOUT_LABEL_ONLY.test(trimmed)) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)

      const label = trimmed.replace(/:$/, '')
      index += 1
      const bodyLines: string[] = []
      while (index < lines.length) {
        const next = lines[index].trim()
        if (
          next === ''
          || MARKDOWN_HEADING.test(next)
          || CALLOUT_LABEL_ONLY.test(next)
          || CALLOUT_INLINE.test(next)
          || LETTER_SECTION.test(next)
          || NUMBER_SECTION.test(next)
          || TOPIC_HEADING.test(next)
        ) {
          break
        }
        bodyLines.push(lines[index].trim())
        index += 1
      }
      pushCallout(label, bodyLines.join('\n'), blocks)
      continue
    }

    const letterSection = LETTER_SECTION.exec(trimmed)
    if (letterSection !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      pushSectionHeading(letterSection[1], blocks)
      index += 1
      continue
    }

    const numberSection = NUMBER_SECTION.exec(trimmed)
    if (numberSection !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      pushSectionHeading(numberSection[1], blocks)
      index += 1
      continue
    }

    const orderedMatch = ORDERED_LINE.exec(line)
    if (orderedMatch !== null) {
      const itemText = orderedMatch[1].trim()
      const topicMatch = ORDERED_TOPIC.exec(trimmed)
      const looksLikeTopic =
        topicMatch !== null
        && !ORDERED_SENTENCE.test(itemText)
        && itemText.split(/\s+/).length <= 6

      if (looksLikeTopic && orderedItems.length === 0 && bulletItems.length === 0) {
        flushParagraph(paragraphBuffer, blocks)
        flushList(bulletItems, false, blocks)
        flushList(orderedItems, true, blocks)
        pushSectionHeading(itemText, blocks)
        index += 1
        continue
      }

      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      orderedItems.push(itemText)
      index += 1
      continue
    }

    const topicHeading = TOPIC_HEADING.exec(trimmed)
    if (topicHeading !== null && calloutVariantFromLabel(topicHeading[1]) === 'default') {
      flushParagraph(paragraphBuffer, blocks)
      flushList(bulletItems, false, blocks)
      flushList(orderedItems, true, blocks)
      pushSectionHeading(topicHeading[1], blocks)
      index += 1
      continue
    }

    const bulletMatch = BULLET_LINE.exec(line)
    if (bulletMatch !== null) {
      flushParagraph(paragraphBuffer, blocks)
      flushList(orderedItems, true, blocks)
      bulletItems.push(bulletMatch[1].trim())
      index += 1
      continue
    }

    flushList(bulletItems, false, blocks)
    flushList(orderedItems, true, blocks)
    paragraphBuffer.push(trimmed)
    index += 1
  }

  flushParagraph(paragraphBuffer, blocks)
  flushList(bulletItems, false, blocks)
  flushList(orderedItems, true, blocks)

  return blocks
}

export function shouldParseAsRichContent(text: string): boolean {
  if (text.includes('\n')) {
    return true
  }
  return /^(#{1,4}\s|[-*•]\s|\d+\.\s|>\s|```|\*\*|__|\*(?!\*)|`)/.test(text.trim())
}
