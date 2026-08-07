import apiClient from './client'
import type { CreateTopicRequest, PaginatedTopicList, TopicResponse, TopicStatus } from '../../types/learning.types'

export const topicApi = {
  list: (params?: { subject?: string; status?: TopicStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedTopicList>('/api/v1/topics', { params }),

  get: (topicId: string) => apiClient.get<TopicResponse>(`/api/v1/topics/${topicId}`),

  create: (payload: CreateTopicRequest) =>
    apiClient.post<TopicResponse>('/api/v1/topics', payload),

  update: (topicId: string, payload: CreateTopicRequest) =>
    apiClient.put<TopicResponse>(`/api/v1/topics/${topicId}`, payload),

  publish: (topicId: string) =>
    apiClient.post<TopicResponse>(`/api/v1/topics/${topicId}/publish`),

  unpublish: (topicId: string) =>
    apiClient.post<TopicResponse>(`/api/v1/topics/${topicId}/unpublish`),

  delete: (topicId: string) => apiClient.delete(`/api/v1/topics/${topicId}`),
}
