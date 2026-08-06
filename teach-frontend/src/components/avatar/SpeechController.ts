import { ttsApi } from '../../services/api/ttsApi'
import type { VoiceProfile } from '../../types/mentor.types'

export type SpeechStatus = 'idle' | 'speaking' | 'unsupported' | 'error'

export type SpeechErrorCode = 'not-allowed' | 'synthesis-failed' | 'network' | 'unknown'

export type SpeakCallbacks = {
  onEnd?: () => void
  onError?: (errorCode: SpeechErrorCode) => void
  onSentenceStart?: (index: number, text: string) => void
  onSentenceEnd?: (index: number, text: string) => void
}

export type SpeakOptions = SpeakCallbacks & {
  voice?: VoiceProfile
  cacheKey?: string
}

export class SpeechController {
  private currentAudio: HTMLAudioElement | null = null
  private audioUrlCache = new Map<string, string>()
  private cacheOrder: string[] = []
  private readonly maxCacheSize = 48
  private activeRequestId = 0
  private prefetchPromises = new Map<string, Promise<string>>()

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  warmUp(): void {
    return
  }

  async speak(text: string, options?: SpeakOptions): Promise<boolean> {
    return this.speakSequence([text], options)
  }

  async speakSequence(chunks: string[], options?: SpeakOptions): Promise<boolean> {
    if (!this.isSupported()) {
      options?.onEnd?.()
      return false
    }

    const sentences = chunks.map((c) => c.trim()).filter((c) => c !== '')
    if (sentences.length === 0) {
      options?.onEnd?.()
      return false
    }

    this.stop()
    const requestId = this.activeRequestId + 1
    this.activeRequestId = requestId

    try {
      if (options?.voice?.pauseBeforeMs !== undefined && options.voice.pauseBeforeMs > 0) {
        await delay(options.voice.pauseBeforeMs)
        if (requestId !== this.activeRequestId) {
          return false
        }
      }

      void this.prefetch(sentences, options?.voice, 1)

      for (let index = 0; index < sentences.length; index += 1) {
        if (requestId !== this.activeRequestId) {
          return false
        }

        const sentence = sentences[index] ?? ''
        options?.onSentenceStart?.(index, sentence)

        void this.prefetch(sentences, options?.voice, index + 2)

        const played = await this.playSentence(sentence, options, requestId)
        if (!played || requestId !== this.activeRequestId) {
          return false
        }

        options?.onSentenceEnd?.(index, sentence)

        if (index < sentences.length - 1) {
          const pauseMs = options?.voice?.pauseBetweenMs ?? 400
          if (pauseMs > 0) {
            await delay(pauseMs)
          }
        }
      }

      if (requestId === this.activeRequestId) {
        options?.onEnd?.()
      }
      return true
    } catch {
      if (requestId === this.activeRequestId) {
        options?.onError?.('network')
        options?.onEnd?.()
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

  private async playSentence(
    text: string,
    options: SpeakOptions | undefined,
    requestId: number,
  ): Promise<boolean> {
    const audioUrl = await this.resolveAudioUrl(text, options?.voice)
    if (requestId !== this.activeRequestId) {
      return false
    }

    return new Promise((resolve) => {
      const audioElement = new Audio(audioUrl)
      if (options?.voice !== undefined) {
        audioElement.playbackRate = options.voice.rate
        audioElement.volume = options.voice.volume
      }
      this.currentAudio = audioElement

      audioElement.onended = () => {
        if (requestId === this.activeRequestId) {
          this.currentAudio = null
          resolve(true)
        }
      }

      audioElement.onerror = () => {
        if (requestId === this.activeRequestId) {
          this.currentAudio = null
          options?.onError?.('synthesis-failed')
          resolve(false)
        }
      }

      audioElement.play().catch(() => {
        if (requestId === this.activeRequestId) {
          this.currentAudio = null
          options?.onError?.('synthesis-failed')
          resolve(false)
        }
      })
    })
  }

  private async resolveAudioUrl(text: string, voice?: VoiceProfile): Promise<string> {
    const cacheLookup = buildCacheKey(text, voice)
    const cached = this.audioUrlCache.get(cacheLookup)
    if (cached !== undefined) {
      return cached
    }

    const pending = this.prefetchPromises.get(cacheLookup)
    if (pending !== undefined) {
      return pending
    }

    const fetchPromise = this.fetchAndCache(text, cacheLookup)
    this.prefetchPromises.set(cacheLookup, fetchPromise)
    try {
      return await fetchPromise
    } finally {
      this.prefetchPromises.delete(cacheLookup)
    }
  }

  private async fetchAndCache(text: string, cacheLookup: string): Promise<string> {
    const audioBlob = await ttsApi.synthesize(text)
    const audioUrl = URL.createObjectURL(audioBlob)
    this.cacheAudioUrl(cacheLookup, audioUrl)
    return audioUrl
  }

  private prefetch(sentences: string[], voice: VoiceProfile | undefined, startIndex: number): void {
    for (let i = startIndex; i < sentences.length && i < startIndex + 2; i += 1) {
      const sentence = sentences[i]
      if (sentence === undefined || sentence.trim() === '') {
        continue
      }
      const key = buildCacheKey(sentence, voice)
      if (this.audioUrlCache.has(key) || this.prefetchPromises.has(key)) {
        continue
      }
      const promise = this.fetchAndCache(sentence, key)
      this.prefetchPromises.set(key, promise)
      void promise.finally(() => {
        this.prefetchPromises.delete(key)
      })
    }
  }

  private cacheAudioUrl(key: string, url: string): void {
    if (this.audioUrlCache.has(key)) {
      return
    }
    this.audioUrlCache.set(key, url)
    this.cacheOrder.push(key)
    while (this.cacheOrder.length > this.maxCacheSize) {
      const oldest = this.cacheOrder.shift()
      if (oldest !== undefined) {
        const evicted = this.audioUrlCache.get(oldest)
        this.audioUrlCache.delete(oldest)
        if (evicted !== undefined) {
          URL.revokeObjectURL(evicted)
        }
      }
    }
  }
}

function buildCacheKey(text: string, voice?: VoiceProfile): string {
  if (voice === undefined) {
    return text
  }
  return `${text}::${voice.rate}:${voice.volume}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const speechController = new SpeechController()
