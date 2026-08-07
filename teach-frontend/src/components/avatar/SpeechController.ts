import { ttsApi } from '../../services/api/ttsApi'
import axios from 'axios'

export type SpeechStatus = 'idle' | 'speaking' | 'unsupported' | 'error'

export type SpeechErrorCode = 'not-allowed' | 'synthesis-failed' | 'network' | 'timeout' | 'unknown'

type SpeakCallbacks = {
  onEnd?: () => void
  onError?: (errorCode: SpeechErrorCode) => void
}

export class SpeechController {
  private currentAudio: HTMLAudioElement | null = null
  private audioUrlCache = new Map<string, string>()
  private activeRequestId = 0

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  warmUp(): void {
    return
  }

  async speak(text: string, callbacks?: SpeakCallbacks): Promise<boolean> {
    if (!this.isSupported()) {
      callbacks?.onEnd?.()
      return false
    }

    const trimmedText = text.trim()
    if (trimmedText === '') {
      callbacks?.onEnd?.()
      return false
    }

    this.stop()
    const requestId = this.activeRequestId + 1
    this.activeRequestId = requestId

    try {
      let audioUrl = this.audioUrlCache.get(trimmedText)
      if (audioUrl === undefined) {
        const audioBlob = await ttsApi.synthesize(trimmedText)
        if (audioBlob.size === 0) {
          throw new Error('empty-audio')
        }
        audioUrl = URL.createObjectURL(audioBlob)
        this.audioUrlCache.set(trimmedText, audioUrl)
      }

      if (requestId !== this.activeRequestId) {
        return false
      }

      const audioElement = new Audio(audioUrl)
      this.currentAudio = audioElement

      audioElement.onended = () => {
        if (requestId === this.activeRequestId) {
          this.currentAudio = null
          callbacks?.onEnd?.()
        }
      }

      audioElement.onerror = () => {
        if (requestId === this.activeRequestId) {
          this.currentAudio = null
          callbacks?.onError?.('synthesis-failed')
          callbacks?.onEnd?.()
        }
      }

      try {
        await audioElement.play()
      } catch (playError) {
        if (requestId !== this.activeRequestId) {
          return false
        }
        const errorName = playError instanceof Error ? playError.name : ''
        callbacks?.onError?.(errorName === 'NotAllowedError' ? 'not-allowed' : 'synthesis-failed')
        callbacks?.onEnd?.()
        return false
      }
      return true
    } catch (fetchError) {
      if (requestId === this.activeRequestId) {
        const isTimeout = axios.isAxiosError(fetchError) && fetchError.code === 'ECONNABORTED'
        callbacks?.onError?.(isTimeout ? 'timeout' : 'network')
        callbacks?.onEnd?.()
      }
      return false
    }
  }

  stop(): void {
    this.activeRequestId += 1
    if (this.currentAudio !== null) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }
}

export const speechController = new SpeechController()
