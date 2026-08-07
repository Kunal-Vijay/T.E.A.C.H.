import apiClient from './client'

const TTS_REQUEST_TIMEOUT_MS = 90000

export const ttsApi = {
  synthesize: async (text: string, languageStyle?: string): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      '/api/v1/tts/speak',
      {
        text,
        ...(languageStyle != null && languageStyle !== ''
          ? { language_style: languageStyle }
          : {}),
      },
      {
        responseType: 'blob',
        timeout: TTS_REQUEST_TIMEOUT_MS,
      },
    )
    return response.data
  },
}
