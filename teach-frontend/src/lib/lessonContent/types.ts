export type CalloutVariant =
  | 'definition'
  | 'example'
  | 'formula'
  | 'important'
  | 'note'
  | 'key-point'
  | 'remember'
  | 'advantages'
  | 'disadvantages'
  | 'applications'
  | 'properties'
  | 'default'

export type LessonBlock =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; variant: CalloutVariant; label: string; body: string }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; code: string; language?: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'hr' }

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
