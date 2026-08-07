import apiClient, { getWithCache } from './client'
import { CACHE_TTL } from './responseCache'
import type {
  GenerationStartedResponse,
  GenerationStatusResponse,
  PaginatedGenerationList,
} from '../../types/api.types'

export const generationApi = {
  getStatus: (generationId: string, options?: { skipCache?: boolean }) =>
    getWithCache<GenerationStatusResponse>(`/api/v1/generations/${generationId}`, {
      cacheKey: `generation:${generationId}`,
      cacheTtlMs: CACHE_TTL.status,
      skipCache: options?.skipCache,
    }).then((data) => ({ data })),
  listByPlan: (planId: string, params?: Record<string, number>) =>
    apiClient.get<PaginatedGenerationList>(`/api/v1/class-plans/${planId}/generations`, { params }),
  trigger: (planId: string) =>
    apiClient.post<GenerationStartedResponse>(`/api/v1/class-plans/${planId}/generate`),
}
