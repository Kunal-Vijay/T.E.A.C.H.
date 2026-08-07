/**
 * Full-screen grading animation while the AI marks the viva.
 * Animated progress steps that check off one by one.
 */

import { useEffect, useState } from 'react'

const STEPS = [
  { label: 'Evaluating conceptual understanding', delay: 0 },
  { label: 'Reviewing your reasoning', delay: 2500 },
  { label: 'Comparing against expected answers', delay: 5500 },
  { label: 'Generating personalized feedback', delay: 9000 },
]

interface VivaGradingScreenProps {
  questionsAnswered: number
}

export default function VivaGradingScreen({ questionsAnswered }: VivaGradingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((step, index) =>
      window.setTimeout(() => setCompletedSteps(index + 1), step.delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="viva-grading">
      <div className="viva-grading-content">
        <div className="viva-grading-spinner" />
        <h2 className="viva-grading-title">Marking your viva</h2>
        <p className="viva-grading-sub">
          Analyzed {questionsAnswered} answer{questionsAnswered !== 1 ? 's' : ''}. This takes
          15–30 seconds.
        </p>

        <ul className="viva-grading-steps">
          {STEPS.map((step, index) => {
            const done = index < completedSteps
            const active = index === completedSteps
            return (
              <li
                key={step.label}
                className={`viva-grading-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
              >
                <span className="viva-grading-step-check">
                  {done ? '✓' : active ? '●' : '○'}
                </span>
                <span className="viva-grading-step-label">{step.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
