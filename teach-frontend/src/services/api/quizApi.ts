import apiClient from './client'
import type { QuizAttemptResponse } from '../../types/api.types'

export const quizApi = {
  submitAttempt: (sessionId: string, questionId: string, selectedOptionId: string) =>
    apiClient.post<QuizAttemptResponse>(`/api/v1/classroom-sessions/${sessionId}/quiz-attempts`, {
      question_id: questionId,
      selected_option_id: selectedOptionId,
    }),
}
