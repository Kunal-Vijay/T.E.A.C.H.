import { CheckCircle2, ChevronRight, CircleHelp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { XP_REWARDS } from '../../constants/xp'
import { pickRandom, QUIZ_CORRECT_LINES, QUIZ_TRY_AGAIN_LINES } from '../../constants/delightCopy'
import { resolveDisplayedError } from '../../services/api/apiError'
import Icon from '../ui/Icon'
import { Button } from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import LessonContent from '../lesson/LessonContent'
import type { QuizAttemptResponse, QuizQuestion } from '../../types/api.types'

interface PopQuizPanelProps {
  questions: QuizQuestion[]
  onSubmit: (questionId: string, selectedOptionId: string) => Promise<QuizAttemptResponse>
  onComplete: () => void
  onQuizResult?: (correct: boolean) => void
}

export default function PopQuizPanel({
  questions,
  onSubmit,
  onComplete,
  onQuizResult,
}: PopQuizPanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<QuizAttemptResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const quizProgressPercent = Math.round(((currentQuestionIndex + (feedback !== null ? 1 : 0)) / questions.length) * 100)

  const handleSelect = async (optionId: string) => {
    if (currentQuestion === undefined || loading) {
      return
    }
    setLoading(true)
    setSubmittingOptionId(optionId)
    setSubmitError(null)
    try {
      const response = await onSubmit(currentQuestion.question_id, optionId)
      setFeedback(response)
      onQuizResult?.(response.is_correct)
      if (response.is_correct) {
        setCorrectCount((count) => count + 1)
        setCelebrating(true)
      }
    } catch (error) {
      const message = resolveDisplayedError(error, {
        component: 'PopQuizPanel',
        action: 'submit_quiz_answer',
      }, 'Could not submit your answer. Try again.')
      if (message !== null) {
        setSubmitError(message)
      }
    } finally {
      setLoading(false)
      setSubmittingOptionId(null)
    }
  }

  useEffect(() => {
    if (!celebrating) {
      return undefined
    }
    const timeoutId = window.setTimeout(() => setCelebrating(false), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [celebrating])

  const handleNext = () => {
    setFeedback(null)
    setCelebrating(false)
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
    <div className="pop-quiz-panel">
      <div className="quiz-header">
        <p className="quiz-kicker">
          <Icon icon={CircleHelp} size={14} />
          Pop quiz
        </p>
        <div className="journey-progress">
          <p className="journey-progress-label">
            Question {currentQuestionIndex + 1} of {questions.length}
            {correctCount > 0 ? ` · ${correctCount} correct` : ''}
          </p>
          <ProgressBar
            variant="journey"
            value={quizProgressPercent}
            milestone
            aria-label={`Quiz progress: question ${currentQuestionIndex + 1} of ${questions.length}`}
          />
        </div>
        <h3>{currentQuestion.question_text}</h3>
      </div>
      {submitError !== null ? (
        <p className="form-error" role="alert">{submitError}</p>
      ) : null}
      <div className="quiz-options">
        {currentQuestion.options.map((option) => (
          <button
            key={option.option_id}
            type="button"
            className={`btn btn-secondary quiz-option${submittingOptionId === option.option_id ? ' is-loading' : ''}`}
            disabled={feedback !== null || loading}
            onClick={() => { void handleSelect(option.option_id) }}
          >
            <span className="quiz-option-id">{option.option_id.toUpperCase()}</span>
            {option.text}
          </button>
        ))}
      </div>
      {feedback !== null ? (
        <div className={`quiz-feedback ${feedback.is_correct ? 'correct' : 'incorrect'}${celebrating ? ' is-celebrating' : ''}`}>
          <div className="quiz-feedback-header">
            <Icon icon={feedback.is_correct ? CheckCircle2 : XCircle} size={18} />
            <strong>{feedback.is_correct ? pickRandom(QUIZ_CORRECT_LINES) : pickRandom(QUIZ_TRY_AGAIN_LINES)}</strong>
            {feedback.is_correct ? (
              <span className="quiz-xp-badge">+{XP_REWARDS.QUIZ_CORRECT} XP</span>
            ) : (
              <span className="quiz-xp-badge">+{XP_REWARDS.QUIZ_TRY} XP</span>
            )}
          </div>
          <div className="quiz-feedback-copy">
            <LessonContent source={feedback.feedback_explanation} />
          </div>
          <Button type="button" variant="primary" withIcon icon={ChevronRight} onClick={handleNext}>
            {currentQuestionIndex + 1 >= questions.length ? 'Continue lesson' : 'Next question'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
