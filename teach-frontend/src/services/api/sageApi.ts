import apiClient from './client'
import type {
  CurrentStateResponse,
  DoubtMessageResponse,
  DoubtSessionDetailResponse,
  DoubtSessionResponse,
} from '../../types/api.types'

export const sageApi = {
  createSession: (sessionId: string) =>
    apiClient.post<DoubtSessionResponse>(`/api/v1/classroom-sessions/${sessionId}/doubt-sessions`),
  getSession: (doubtSessionId: string) =>
    apiClient.get<DoubtSessionDetailResponse>(`/api/v1/doubt-sessions/${doubtSessionId}`),
  ask: (doubtSessionId: string, studentMessage: string) =>
    apiClient.post<DoubtMessageResponse>(`/api/v1/doubt-sessions/${doubtSessionId}/messages`, {
      student_message: studentMessage,
    }),
  close: (doubtSessionId: string) =>
    apiClient.post<CurrentStateResponse>(`/api/v1/doubt-sessions/${doubtSessionId}/close`),
}
