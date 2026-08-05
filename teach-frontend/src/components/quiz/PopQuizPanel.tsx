import { useState } from 'react'
import type { QuizAttemptResponse, QuizQuestion } from '../../types/api.types'

interface PopQuizPanelProps {
  questions: QuizQuestion[]
  onSubmit: (questionId: string, selectedOptionId: string) => Promise<QuizAttemptResponse>
  onComplete: () => void
}

export default function PopQuizPanel({ questions, onSubmit, onComplete }: PopQuizPanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<QuizAttemptResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  const handleSelect = async (optionId: string) => {
    if (currentQuestion === undefined || loading) {
      return
    }
    setLoading(true)
    try {
      const response = await onSubmit(currentQuestion.question_id, optionId)
      setFeedback(response)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setFeedback(null)
    if (currentQuestionIndex + 1 >= questions.length) {
      onComplete()
      return
    }
    setCurrentQuestionIndex((previousIndex) => previousIndex + 1)
  }

  if (currentQuestion === undefined) {
    return null
  }

  return (
    <div className="pop-quiz-panel card">
      <h3>Pop Quiz</h3>
      <p>{currentQuestion.question_text}</p>
      <div className="quiz-options">
        {currentQuestion.options.map((option) => (
          <button
            key={option.option_id}
            className="btn btn-secondary quiz-option"
            disabled={feedback !== null || loading}
            onClick={() => handleSelect(option.option_id)}
          >
            {option.option_id.toUpperCase()}. {option.text}
          </button>
        ))}
      </div>
      {feedback !== null ? (
        <div className={`quiz-feedback ${feedback.is_correct ? 'correct' : 'incorrect'}`}>
          <strong>{feedback.is_correct ? 'Correct!' : 'Not quite'}</strong>
          <p>{feedback.feedback_explanation}</p>
          <button className="btn btn-primary" onClick={handleNext}>
            {currentQuestionIndex + 1 >= questions.length ? 'Continue' : 'Next Question'}
          </button>
        </div>
      ) : null}
      <style>{`
        .pop-quiz-panel { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .quiz-options { display: flex; flex-direction: column; gap: 0.5rem; }
        .quiz-option { text-align: left; }
        .quiz-feedback { padding: 0.75rem 1rem; border-radius: 12px; background: #f8fafc; }
        .quiz-feedback.correct { border-left: 4px solid #16a34a; }
        .quiz-feedback.incorrect { border-left: 4px solid #dc2626; }
      `}</style>
    </div>
  )
}
