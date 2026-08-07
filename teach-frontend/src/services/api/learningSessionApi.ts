import apiClient from './client'
import type {
  InputChannel,
  LearningMode,
  LearningSessionResponse,
  StudentParamOverrides,
  VivaAdvanceReason,
  VoiceVivaAssessment,
  VoiceVivaHealth,
} from '../../types/learning.types'

const SESSION_TIMEOUT_MS = 120_000
const SESSION_START_TIMEOUT_MS = 15_000
const SESSION_POLL_TIMEOUT_MS = 15_000

export const learningSessionApi = {
  start: (payload: {
    topic_id: string
    mode: LearningMode
    student_identifier: string
    param_overrides?: StudentParamOverrides
  }) =>
    apiClient.post<LearningSessionResponse>('/api/v1/learning-sessions', payload, {
      timeout: SESSION_START_TIMEOUT_MS,
    }),

  get: (sessionId: string, options?: { poll?: boolean }) =>
    apiClient.get<LearningSessionResponse>(`/api/v1/learning-sessions/${sessionId}`, {
      timeout: options?.poll ? SESSION_POLL_TIMEOUT_MS : SESSION_TIMEOUT_MS,
    }),

  retryFirstTurn: (sessionId: string) =>
    apiClient.post<LearningSessionResponse>(
      `/api/v1/learning-sessions/${sessionId}/retry-first-turn`,
      {},
      { timeout: SESSION_START_TIMEOUT_MS },
    ),

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

  // --- Spoken viva ---
  // The viva itself runs over a WebSocket (see lib/voice/novaSonicAudio.ts); these
  // are the REST endpoints around it.
  voiceHealth: () =>
    apiClient.get<VoiceVivaHealth>('/api/v1/learning-sessions/voice/health'),

  /** Re-read a stored assessment, for when the student reloads after finishing. */
  voiceVivaAssessment: (sessionId: string) =>
    apiClient.post<VoiceVivaAssessment>(
      `/api/v1/learning-sessions/${sessionId}/viva/voice/complete`,
      {},
      { timeout: SESSION_TIMEOUT_MS },
    ),
}
