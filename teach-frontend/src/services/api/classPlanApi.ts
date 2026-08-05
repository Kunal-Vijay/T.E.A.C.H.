import apiClient from './client'
import type {
  ClassPlanDetailResponse,
  ClassPlanResponse,
  CreateClassPlanRequest,
  PaginatedClassPlanList,
} from '../../types/api.types'

export const classPlanApi = {
  create: (payload: CreateClassPlanRequest) =>
    apiClient.post<ClassPlanResponse>('/api/v1/class-plans', payload),
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedClassPlanList>('/api/v1/class-plans', { params }),
  get: (planId: string) =>
    apiClient.get<ClassPlanDetailResponse>(`/api/v1/class-plans/${planId}`),
  publish: (planId: string) =>
    apiClient.post<ClassPlanResponse>(`/api/v1/class-plans/${planId}/publish`),
  generate: (planId: string) =>
    apiClient.post(`/api/v1/class-plans/${planId}/generate`),
}
