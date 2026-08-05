import apiClient from './client'
import type { GenerationStartedResponse, GenerationStatusResponse } from '../../types/api.types'

export const generationApi = {
  getStatus: (generationId: string) =>
    apiClient.get<GenerationStatusResponse>(`/api/v1/generations/${generationId}`),
  trigger: (planId: string) =>
    apiClient.post<GenerationStartedResponse>(`/api/v1/class-plans/${planId}/generate`),
}
