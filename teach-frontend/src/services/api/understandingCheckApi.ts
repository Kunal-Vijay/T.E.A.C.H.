import apiClient from './client'
import type {
  UnderstandingCheckHealth,
  UnderstandingCheckPrompt,
  UnderstandingCheckTopicList,
  UnderstandingFeedback,
  UnderstandingFeedbackRequest,
} from '../../types/api.types'

export const understandingCheckApi = {
  health: () => apiClient.get<UnderstandingCheckHealth>('/api/v1/understanding-check/health'),
  listTopics: (generationId: string) =>
    apiClient.get<UnderstandingCheckTopicList>(
      `/api/v1/understanding-check/generations/${generationId}/topics`,
    ),
  previewPrompt: (generationId: string, topicId: string, classroomSessionId?: string | null) =>
    apiClient.get<UnderstandingCheckPrompt>(
      `/api/v1/understanding-check/generations/${generationId}/topics/${topicId}/prompt`,
      {
        params:
          classroomSessionId != null && classroomSessionId !== ''
            ? { classroom_session_id: classroomSessionId }
            : undefined,
      },
    ),
  // Assessment runs a text model over the whole transcript, so give it longer
  // than the client's default 15s timeout.
  requestFeedback: (payload: UnderstandingFeedbackRequest) =>
    apiClient.post<UnderstandingFeedback>('/api/v1/understanding-check/feedback', payload, {
      timeout: 60_000,
    }),
}
