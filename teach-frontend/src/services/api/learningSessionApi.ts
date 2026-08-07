import apiClient from './client'
import type {
  InputChannel,
  LearningMode,
  LearningSessionResponse,
  StudentParamOverrides,
  VivaAdvanceReason,
} from '../../types/learning.types'

const SESSION_TIMEOUT_MS = 120_000

export const learningSessionApi = {
  start: (payload: {
    topic_id: string
    mode: LearningMode
    student_identifier: string
    param_overrides?: StudentParamOverrides
  }) =>
    apiClient.post<LearningSessionResponse>('/api/v1/learning-sessions', payload, {
      timeout: SESSION_TIMEOUT_MS,
    }),

  get: (sessionId: string) =>
    apiClient.get<LearningSessionResponse>(`/api/v1/learning-sessions/${sessionId}`, {
      timeout: SESSION_TIMEOUT_MS,
    }),

  submitTurn: (sessionId: string, payload: { message: string; channel: InputChannel }) =>
    apiClient.post<LearningSessionResponse>(
      `/api/v1/learning-sessions/${sessionId}/turns`,
      payload,
      { timeout: SESSION_TIMEOUT_MS },
    ),

  advanceViva: (sessionId: string, reason: VivaAdvanceReason) =>
    apiClient.post<LearningSessionResponse>(
      `/api/v1/learning-sessions/${sessionId}/viva/advance`,
      { reason },
      { timeout: SESSION_TIMEOUT_MS },
    ),

  abandon: (sessionId: string) =>
    apiClient.post<LearningSessionResponse>(
      `/api/v1/learning-sessions/${sessionId}/abandon`,
      {},
      { timeout: SESSION_TIMEOUT_MS },
    ),
}
