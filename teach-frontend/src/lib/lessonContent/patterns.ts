import type { CalloutVariant } from './types'

export const CALLOUT_LABELS: Record<string, CalloutVariant> = {
  definition: 'definition',
  example: 'example',
  formula: 'formula',
  important: 'important',
  note: 'note',
  'key point': 'key-point',
  remember: 'remember',
  advantages: 'advantages',
  disadvantages: 'disadvantages',
  applications: 'applications',
  properties: 'properties',
}

export const MARKDOWN_HEADING = /^(#{1,4})\s+(.+)$/
export const MARKDOWN_HR = /^(-{3,}|\*{3,}|_{3,})$/
export const MARKDOWN_BLOCKQUOTE = /^>\s?(.*)$/
export const BULLET_LINE = /^[\t ]*[-*•]\s+(.+)$/
export const ORDERED_LINE = /^[\t ]*\d+\.\s+(.+)$/
export const ORDERED_TOPIC = /^\d+\.\s+([A-Z][A-Za-z\s,'()-]{2,55})$/
export const ORDERED_SENTENCE = /\b(is|are|was|were|has|have|will|can|means|includes|occurs)\b/i
export const LETTER_SECTION = /^\([a-z]\)\s*(.+?)(?::)?\s*$/i
export const NUMBER_SECTION = /^\(\d+\)\s*(.+?)(?::)?\s*$/
export const CALLOUT_INLINE = /^(Definition|Example|Formula|Important|Key Point|Remember|Note|Advantages|Disadvantages|Applications|Properties):\s*(.*)$/i
export const CALLOUT_LABEL_ONLY = /^(Definition|Example|Formula|Important|Key Point|Remember|Note|Advantages|Disadvantages|Applications|Properties):\s*$/i
export const TOPIC_HEADING = /^([A-Z][A-Za-z0-9\s,'()-]{2,60}):\s*$/

export function calloutVariantFromLabel(label: string): CalloutVariant {
  return CALLOUT_LABELS[label.trim().toLowerCase()] ?? 'default'
}
