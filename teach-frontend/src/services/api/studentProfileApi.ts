import apiClient from './client'
import type { StudentProfileResponse, StudentParamsSnapshot } from '../../types/learning.types'

export const studentProfileApi = {
  getAttributes: (studentIdentifier: string) =>
    apiClient.get<StudentProfileResponse>(`/api/v1/students/${studentIdentifier}/attributes`),

  updateAttributes: (
    studentIdentifier: string,
    payload: { display_name?: string | null; attributes: StudentParamsSnapshot },
  ) =>
    apiClient.put<StudentProfileResponse>(
      `/api/v1/students/${studentIdentifier}/attributes`,
      payload,
    ),
}
