import apiClient from './client'

const TTS_REQUEST_TIMEOUT_MS = 90000

export interface TtsSynthesizeParams {
  text: string
  languageStyle?: string
  persona?: string
}

export interface TtsPersona {
  id: string
  display_name: string
  style: string
}

export const ttsApi = {
  /**
   * Synthesize speech from text via the backend proxy (Google Cloud TTS).
   * The persona determines which voice is used.
   */
  synthesize: async (text: string, languageStyle?: string, persona?: string): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      '/api/v1/tts/speak',
      {
        text,
        ...(languageStyle != null && languageStyle !== ''
          ? { language_style: languageStyle }
          : {}),
        ...(persona != null && persona !== '' ? { persona } : {}),
      },
      {
        responseType: 'blob',
        timeout: TTS_REQUEST_TIMEOUT_MS,
      },
    )
    return response.data
  },

  /** Fetch the available voice personas from the server. */
  listPersonas: async (): Promise<TtsPersona[]> => {
    const response = await apiClient.get<TtsPersona[]>('/api/v1/tts/personas')
    return response.data
  },
}
