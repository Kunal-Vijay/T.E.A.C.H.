import { ttsApi } from '../../services/api/ttsApi'

export type SpeechStatus = 'idle' | 'speaking' | 'unsupported' | 'error'

export type SpeechErrorCode = 'not-allowed' | 'synthesis-failed' | 'network' | 'unknown'

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

      await audioElement.play()
      return true
    } catch {
      if (requestId === this.activeRequestId) {
        callbacks?.onError?.('network')
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
