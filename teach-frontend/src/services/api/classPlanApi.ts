import apiClient, { getWithCache } from './client'
import { CACHE_TTL, invalidateCache } from './responseCache'
import type {
  ClassPlanDetailResponse,
  ClassPlanResponse,
  CreateClassPlanRequest,
  PaginatedClassPlanList,
} from '../../types/api.types'

export const classPlanApi = {
  create: async (payload: CreateClassPlanRequest) => {
    const response = await apiClient.post<ClassPlanResponse>('/api/v1/class-plans', payload)
    invalidateCache('class-plans')
    return response
  },
  update: async (planId: string, payload: CreateClassPlanRequest) => {
    const response = await apiClient.put<ClassPlanResponse>(`/api/v1/class-plans/${planId}`, payload)
    invalidateCache('class-plan')
    invalidateCache('class-plans')
    return response
  },
  list: (params?: Record<string, string | number>) =>
    getWithCache<PaginatedClassPlanList>('/api/v1/class-plans', {
      params,
      cacheKey: `class-plans:${JSON.stringify(params ?? {})}`,
      cacheTtlMs: CACHE_TTL.list,
    }).then((data) => ({ data })),
  get: (planId: string) =>
    getWithCache<ClassPlanDetailResponse>(`/api/v1/class-plans/${planId}`, {
      cacheKey: `class-plan:${planId}`,
      cacheTtlMs: CACHE_TTL.detail,
    }).then((data) => ({ data })),
  publish: async (planId: string) => {
    const response = await apiClient.post<ClassPlanResponse>(`/api/v1/class-plans/${planId}/publish`)
    invalidateCache('class-plan')
    invalidateCache('class-plans')
    return response
  },
  unpublish: async (planId: string) => {
    const response = await apiClient.post<ClassPlanResponse>(`/api/v1/class-plans/${planId}/unpublish`)
    invalidateCache('class-plan')
    invalidateCache('class-plans')
    return response
  },
  generate: (planId: string) =>
    apiClient.post(`/api/v1/class-plans/${planId}/generate`),
}
