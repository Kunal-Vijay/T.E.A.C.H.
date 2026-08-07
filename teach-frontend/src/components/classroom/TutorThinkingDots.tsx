interface TutorThinkingDotsProps {
  className?: string
}

/** Tasteful thinking indicator — no spinners. */
export default function TutorThinkingDots({ className = '' }: TutorThinkingDotsProps) {
  return (
    <span
      className={`tutor-thinking-dots${className !== '' ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <span className="tutor-thinking-dot" />
      <span className="tutor-thinking-dot" />
      <span className="tutor-thinking-dot" />
    </span>
  )
}
