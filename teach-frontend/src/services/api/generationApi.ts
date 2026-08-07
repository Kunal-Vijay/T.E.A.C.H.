import apiClient from './client'
import type {
  GenerationStartedResponse,
  GenerationStatusResponse,
  PaginatedGenerationList,
} from '../../types/api.types'

export const generationApi = {
  getStatus: (generationId: string) =>
    apiClient.get<GenerationStatusResponse>(`/api/v1/generations/${generationId}`),
  listByPlan: (planId: string, params?: Record<string, number>) =>
    apiClient.get<PaginatedGenerationList>(`/api/v1/class-plans/${planId}/generations`, { params }),
  trigger: (planId: string) =>
    apiClient.post<GenerationStartedResponse>(`/api/v1/class-plans/${planId}/generate`),
}
