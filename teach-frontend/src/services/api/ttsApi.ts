import apiClient from './client'

export const ttsApi = {
  synthesize: async (text: string): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      '/api/v1/tts/speak',
      { text },
      { responseType: 'blob' },
    )
    return response.data
  },
}
