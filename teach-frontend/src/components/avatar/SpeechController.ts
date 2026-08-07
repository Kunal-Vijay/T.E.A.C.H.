import axios from 'axios'
import { ttsApi } from '../../services/api/ttsApi'
import { getPauseAfterMs } from '../../lib/speech/speechPause'
import type { VoiceProfile } from '../../types/mentor.types'

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'paused' | 'unsupported' | 'error'

export type SpeechErrorCode = 'not-allowed' | 'synthesis-failed' | 'network' | 'timeout' | 'unknown'

export type SpeakCallbacks = {
  onEnd?: () => void
  onError?: (errorCode: SpeechErrorCode) => void
  onSentenceStart?: (index: number, text: string) => void
  onSentenceEnd?: (index: number, text: string) => void
  onPlaybackStart?: (index: number, text: string) => void
  onPlaybackProgress?: (
    index: number,
    text: string,
    currentTimeSeconds: number,
    durationSeconds: number,
  ) => void
}

/** One queued TTS clip with optional punctuation-aware gap before the next. */
export type SpeechQueueItem = {
  text: string
  pauseAfterMs?: number
}

export type SpeakOptions = SpeakCallbacks & {
  voice?: VoiceProfile
  cacheKey?: string
  /** Uniform gap override — skips punctuation-aware pacing when set. */
  gapMs?: number
  /** How many upcoming segments to prefetch while playing. */
  prefetchAhead?: number
  languageStyle?: string
  /** ElevenLabs persona ID (e.g. "male", "female"). Passed to the backend proxy. */
  persona?: string
}

export class SpeechController {
  private currentAudio: HTMLAudioElement | null = null
  private audioUrlCache = new Map<string, string>()
  private cacheOrder: string[] = []
  private readonly maxCacheSize = 48
  private activeRequestId = 0
  private prefetchPromises = new Map<string, Promise<string>>()
  private paused = false
  private resumeWaiters: Array<() => void> = []
  private currentLanguageStyle: string | undefined = undefined
  private currentPersona: string | undefined = undefined

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  warmUp(): void {
    return
  }

  async speak(text: string, options?: SpeakOptions): Promise<boolean> {
    return this.speakSequence([{ text }], options)
  }

  async speakSequence(chunks: string[] | SpeechQueueItem[], options?: SpeakOptions): Promise<boolean> {
    if (!this.isSupported()) {
      options?.onEnd?.()
      return false
    }

    const items = normalizeSpeechQueue(chunks)
    if (items.length === 0) {
      options?.onEnd?.()
      return false
    }

    this.stop()
    const requestId = this.activeRequestId + 1
    this.activeRequestId = requestId
    this.currentLanguageStyle = options?.languageStyle
    this.currentPersona = options?.persona

    try {
      if (options?.voice?.pauseBeforeMs !== undefined && options.voice.pauseBeforeMs > 0) {
        await delayInterruptible(options.voice.pauseBeforeMs, requestId, () => this.activeRequestId, () => this.waitIfPaused())
        if (requestId !== this.activeRequestId) {
          return false
        }
      }

      const texts = items.map((item) => item.text)
      void this.prefetch(texts, options?.voice, 1, options?.prefetchAhead ?? 2)

      for (let index = 0; index < items.length; index += 1) {
        if (requestId !== this.activeRequestId) {
          return false
        }

        const item = items[index] ?? { text: '' }
        const sentence = item.text

        await this.waitIfPaused()
        if (requestId !== this.activeRequestId) {
          return false
        }

        options?.onSentenceStart?.(index, sentence)

        void this.prefetch(texts, options?.voice, index + 2, options?.prefetchAhead ?? 2)

        const played = await this.playSentence(sentence, options, requestId, index)
        if (!played || requestId !== this.activeRequestId) {
          return false
        }

        options?.onSentenceEnd?.(index, sentence)

        if (index < items.length - 1) {
          const pauseMs = resolvePauseAfterMs(item, options)
          if (pauseMs > 0) {
            await delayInterruptible(pauseMs, requestId, () => this.activeRequestId, () => this.waitIfPaused())
          }
        }
      }

      if (requestId === this.activeRequestId) {
        options?.onEnd?.()
      }
      return true
    } catch (fetchError) {
      if (requestId === this.activeRequestId) {
        const isTimeout = axios.isAxiosError(fetchError) && fetchError.code === 'ECONNABORTED'
        options?.onError?.(isTimeout ? 'timeout' : 'network')
        options?.onEnd?.()
      }
      return false
    }
  }

  stop(): void {
    this.activeRequestId += 1
    this.paused = false
    this.flushResumeWaiters()
    if (this.currentAudio !== null) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  pause(): void {
    if (this.currentAudio === null) {
      this.paused = true
      return
    }
    this.paused = true
    this.currentAudio.pause()
  }

  resume(): void {
    if (!this.paused) {
      return
    }
    this.paused = false
    if (this.currentAudio !== null) {
      void this.currentAudio.play()
    }
    this.flushResumeWaiters()
  }

  isPaused(): boolean {
    return this.paused
  }

  private async waitIfPaused(): Promise<void> {
    while (this.paused) {
      await new Promise<void>((resolve) => {
        this.resumeWaiters.push(resolve)
      })
    }
  }

  private flushResumeWaiters(): void {
    const waiters = this.resumeWaiters.splice(0)
    for (const resolve of waiters) {
      resolve()
    }
  }

  /** Prefetch audio for all segments before playback starts. */
  prefetchAll(segments: string[], voice?: VoiceProfile): void {
    for (const segment of segments) {
      if (segment.trim() === '') {
        continue
      }
      void this.resolveAudioUrl(segment, voice)
    }
  }

  private async playSentence(
    text: string,
    options: SpeakOptions | undefined,
    requestId: number,
    sentenceIndex: number,
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

      const cleanupListeners = () => {
        audioElement.onended = null
        audioElement.onerror = null
        audioElement.onplaying = null
        audioElement.ontimeupdate = null
      }

      audioElement.onplaying = () => {
        if (requestId === this.activeRequestId) {
          options?.onPlaybackStart?.(sentenceIndex, text)
        }
      }

      audioElement.ontimeupdate = () => {
        if (requestId !== this.activeRequestId) {
          return
        }
        const durationSeconds = audioElement.duration
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
          return
        }
        options?.onPlaybackProgress?.(
          sentenceIndex,
          text,
          audioElement.currentTime,
          durationSeconds,
        )
      }

      audioElement.onended = () => {
        if (requestId === this.activeRequestId) {
          cleanupListeners()
          this.currentAudio = null
          resolve(true)
        }
      }

      audioElement.onerror = () => {
        if (requestId === this.activeRequestId) {
          cleanupListeners()
          this.currentAudio = null
          options?.onError?.('synthesis-failed')
          resolve(false)
        }
      }

      audioElement.play().then(() => {
        if (requestId === this.activeRequestId) {
          options?.onPlaybackStart?.(sentenceIndex, text)
        }
      }).catch(() => {
        if (requestId === this.activeRequestId) {
          cleanupListeners()
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
    const audioBlob = await ttsApi.synthesize(text, this.currentLanguageStyle, this.currentPersona)
    if (audioBlob.size === 0) {
      throw new Error('empty-audio')
    }
    const audioUrl = URL.createObjectURL(audioBlob)
    this.cacheAudioUrl(cacheLookup, audioUrl)
    return audioUrl
  }

  private prefetch(
    sentences: string[],
    voice: VoiceProfile | undefined,
    startIndex: number,
    ahead = 2,
  ): void {
    for (let i = startIndex; i < sentences.length && i < startIndex + ahead; i += 1) {
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

function normalizeSpeechQueue(chunks: string[] | SpeechQueueItem[]): SpeechQueueItem[] {
  return chunks
    .map((chunk) => (typeof chunk === 'string' ? { text: chunk } : chunk))
    .map((item) => ({ ...item, text: item.text.trim() }))
    .filter((item) => item.text !== '')
}

function resolvePauseAfterMs(item: SpeechQueueItem, options?: SpeakOptions): number {
  if (item.pauseAfterMs !== undefined) {
    return item.pauseAfterMs
  }
  if (options?.gapMs !== undefined) {
    return options.gapMs
  }
  return getPauseAfterMs(item.text, {
    rate: options?.voice?.rate,
    pacingMs: options?.voice?.pauseBetweenMs,
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function delayInterruptible(
  ms: number,
  requestId: number,
  getActiveRequestId: () => number,
  waitIfPaused: () => Promise<void>,
): Promise<void> {
  const endAt = Date.now() + ms
  while (Date.now() < endAt) {
    if (requestId !== getActiveRequestId()) {
      return
    }
    await waitIfPaused()
    const remaining = endAt - Date.now()
    if (remaining <= 0) {
      return
    }
    await delay(Math.min(remaining, 50))
  }
}

export const speechController = new SpeechController()
