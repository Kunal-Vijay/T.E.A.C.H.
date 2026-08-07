import apiClient from './client'

const TTS_REQUEST_TIMEOUT_MS = 90000

export const ttsApi = {
  synthesize: async (text: string): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      '/api/v1/tts/speak',
      { text },
      {
        responseType: 'blob',
        timeout: TTS_REQUEST_TIMEOUT_MS,
      },
    )
    return response.data
  },
}
