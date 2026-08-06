import { Fragment, useMemo, type ReactNode } from 'react'
import { parseInlineMarkdown } from '../../lib/lessonContent/parseInline'
import { parseLessonContent, shouldParseAsRichContent } from '../../lib/lessonContent/parseLessonContent'
import type { InlineNode, LessonBlock } from '../../lib/lessonContent/types'

interface LessonContentProps {
  source: string
  className?: string
  /** Render a single line without block parsing (for list items). */
  inline?: boolean
}

function renderInlineNodes(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    if (node.type === 'strong') {
      return <strong key={key}>{node.value}</strong>
    }
    if (node.type === 'em') {
      return <em key={key}>{node.value}</em>
    }
    if (node.type === 'code') {
      return <code key={key}>{node.value}</code>
    }
    return <Fragment key={key}>{node.value}</Fragment>
  })
}

function InlineContent({ text }: { text: string }) {
  const nodes = useMemo(() => parseInlineMarkdown(text), [text])
  return <>{renderInlineNodes(nodes, 'inline')}</>
}

function LessonBlockView({ block, index }: { block: LessonBlock; index: number }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4'
      const className =
        block.level === 2
          ? 'lesson-heading'
          : block.level === 3
            ? 'lesson-subheading'
            : 'lesson-minor-heading'
      return (
        <Tag className={className}>
          <InlineContent text={block.text} />
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p className="lesson-paragraph">
          <InlineContent text={block.text} />
        </p>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag className={`lesson-list${block.ordered ? ' lesson-list-ordered' : ''}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>
              <InlineContent text={item} />
            </li>
          ))}
        </ListTag>
      )
    }
    case 'callout':
      return (
        <aside className={`lesson-callout lesson-callout--${block.variant}`}>
          <p className="lesson-callout-label">{block.label}</p>
          {block.body !== '' ? (
            <div className="lesson-callout-body">
              <LessonContent source={block.body} />
            </div>
          ) : null}
        </aside>
      )
    case 'blockquote':
      return (
        <blockquote className="lesson-blockquote">
          <InlineContent text={block.text} />
        </blockquote>
      )
    case 'code':
      return (
        <pre className="lesson-code-block">
          <code>{block.code}</code>
        </pre>
      )
    case 'table':
      return (
        <div className="lesson-table-wrap">
          <table className="lesson-table">
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${index}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${index}-${rowIndex}-${cellIndex}`}>
                      <InlineContent text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'hr':
      return <hr className="lesson-divider" />
    default:
      return null
  }
}

export default function LessonContent({ source, className = '', inline = false }: LessonContentProps) {
  const blocks = useMemo(() => {
    const trimmed = source.trim()
    if (trimmed === '') {
      return []
    }
    if (inline || !shouldParseAsRichContent(trimmed)) {
      return [{ type: 'paragraph' as const, text: trimmed }]
    }
    return parseLessonContent(trimmed)
  }, [inline, source])

  if (blocks.length === 0) {
    return null
  }

  if (inline && blocks.length === 1 && blocks[0].type === 'paragraph') {
    return (
      <span className={`lesson-inline ${className}`.trim()}>
        <InlineContent text={blocks[0].text} />
      </span>
    )
  }

  return (
    <div className={`lesson-content ${className}`.trim()}>
      {blocks.map((block, index) => (
        <LessonBlockView key={`${block.type}-${index}`} block={block} index={index} />
      ))}
    </div>
  )
}
