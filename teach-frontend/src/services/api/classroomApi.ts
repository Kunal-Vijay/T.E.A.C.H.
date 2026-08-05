import apiClient from './client'
import type { ClassroomSessionResponse, CurrentStateResponse } from '../../types/api.types'

export const classroomApi = {
  create: (generationId: string, studentIdentifier?: string) =>
    apiClient.post<ClassroomSessionResponse>('/api/v1/classroom-sessions', {
      generation_id: generationId,
      student_identifier: studentIdentifier,
    }),
  getCurrent: (sessionId: string) =>
    apiClient.get<CurrentStateResponse>(`/api/v1/classroom-sessions/${sessionId}/current`),
  advance: (sessionId: string) =>
    apiClient.post<CurrentStateResponse>(`/api/v1/classroom-sessions/${sessionId}/advance`),
  submitPrediction: (sessionId: string, predictionText: string) =>
    apiClient.post<CurrentStateResponse>(`/api/v1/classroom-sessions/${sessionId}/student-input`, {
      prediction_text: predictionText,
    }),
  skipDoubts: (sessionId: string) =>
    apiClient.post<CurrentStateResponse>(`/api/v1/classroom-sessions/${sessionId}/skip-doubts`),
}
