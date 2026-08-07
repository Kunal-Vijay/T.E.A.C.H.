import { useEffect, useRef } from 'react'
import LessonContent from '../lesson/LessonContent'
import type { SessionTurn } from '../../types/learning.types'

interface LiveClassroomConversationProps {
  turns: SessionTurn[]
}

function formatTime(iso: string | null): string {
  if (iso == null || iso === '') {
    return ''
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function LiveClassroomConversation({ turns }: LiveClassroomConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrolledTutorIdRef = useRef<string | null>(null)

  useEffect(() => {
    const lastTurn = turns[turns.length - 1]
    if (lastTurn == null || lastTurn.role !== 'tutor') {
      return
    }
    if (lastTurn.id === lastScrolledTutorIdRef.current) {
      return
    }
    lastScrolledTutorIdRef.current = lastTurn.id

    const node = scrollRef.current
    if (node == null) {
      return
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [turns])

  return (
    <section className="live-classroom-chat" aria-label="Conversation history">
      <header className="live-classroom-chat__header">
        <h2>Conversation</h2>
      </header>
      <div ref={scrollRef} className="live-classroom-chat__scroll">
        {turns.length === 0 ? (
          <p className="live-classroom-chat__empty">Ask Nova anything — your lesson notes appear here.</p>
        ) : (
          turns.map((turn) => (
            <article
              key={turn.id}
              className={`live-classroom-chat__bubble live-classroom-chat__bubble--${turn.role}`}
            >
              <div className="live-classroom-chat__bubble-meta">
                <span className="live-classroom-chat__author">
                  {turn.role === 'tutor' ? 'Nova' : 'You'}
                </span>
                {turn.created_at != null ? (
                  <time className="live-classroom-chat__time" dateTime={turn.created_at}>
                    {formatTime(turn.created_at)}
                  </time>
                ) : null}
              </div>
              <div className="live-classroom-chat__body">
                <LessonContent source={turn.text} />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
