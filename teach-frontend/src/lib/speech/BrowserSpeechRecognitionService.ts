import type {
  SpeechRecognitionCallbacks,
  SpeechRecognitionErrorCode,
  SpeechRecognitionOptions,
  SpeechRecognitionService,
  SpeechRecognitionStatus,
} from './speechRecognitionTypes'

interface BrowserRecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}

interface BrowserRecognitionEvent extends Event {
  resultIndex: number
  results: ArrayLike<BrowserRecognitionResult>
}

interface BrowserRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface BrowserRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: BrowserRecognitionEvent) => void) | null
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type RecognitionConstructor = new () => BrowserRecognitionInstance

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function mapErrorCode(error: string): SpeechRecognitionErrorCode {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'not-allowed'
  }
  if (error === 'no-speech') {
    return 'no-speech'
  }
  if (error === 'network') {
    return 'network'
  }
  if (error === 'aborted') {
    return 'aborted'
  }
  return 'unknown'
}

export class BrowserSpeechRecognitionService implements SpeechRecognitionService {
  private recognition: BrowserRecognitionInstance | null = null

  private status: SpeechRecognitionStatus = 'idle'

  private callbacks: SpeechRecognitionCallbacks = {}

  private options: SpeechRecognitionOptions = {}

  private finalTranscript = ''

  private interimTranscript = ''

  private lastSpeechAt = 0

  private silenceTimer: number | null = null

  private maxDurationTimer: number | null = null

  private hadSpeech = false

  isSupported(): boolean {
    return getRecognitionConstructor() !== null
  }

  getStatus(): SpeechRecognitionStatus {
    return this.status
  }

  start(options: SpeechRecognitionOptions = {}, callbacks: SpeechRecognitionCallbacks = {}): void {
    this.abort()
    this.callbacks = callbacks
    this.options = {
      language: options.language ?? 'en-US',
      silenceTimeoutMs: options.silenceTimeoutMs ?? 1500,
      maxDurationMs: options.maxDurationMs ?? 45000,
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? true,
    }
    this.finalTranscript = ''
    this.interimTranscript = ''
    this.hadSpeech = false
    this.lastSpeechAt = Date.now()

    const Recognition = getRecognitionConstructor()
    if (Recognition === null) {
      this.status = 'error'
      this.callbacks.onError?.('not-supported', 'Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new Recognition()
    recognition.continuous = this.options.continuous ?? true
    recognition.interimResults = this.options.interimResults ?? true
    recognition.lang = this.options.language ?? 'en-US'

    recognition.onstart = () => {
      this.status = 'listening'
      this.callbacks.onStart?.()
      this.startSilenceWatch()
      this.startMaxDurationWatch()
    }

    recognition.onresult = (event: BrowserRecognitionEvent) => {
      let interim = ''
      let final = this.finalTranscript

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result === undefined) {
          continue
        }
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          final = `${final} ${text}`.trim()
        } else {
          interim = `${interim} ${text}`.trim()
        }
      }

      this.finalTranscript = final
      this.interimTranscript = interim
      const combined = `${final} ${interim}`.trim()

      if (combined !== '') {
        this.hadSpeech = true
        this.lastSpeechAt = Date.now()
      }

      this.callbacks.onResult?.({
        transcript: combined,
        isFinal: interim === '' && final !== '',
      })
    }

    recognition.onerror = (event: BrowserRecognitionErrorEvent) => {
      const code = mapErrorCode(event.error)
      this.status = 'error'
      this.clearTimers()
      this.callbacks.onError?.(code, event.message ?? event.error)
    }

    recognition.onend = () => {
      this.clearTimers()
      if (this.status === 'listening') {
        this.status = 'stopped'
      }
      const transcript = `${this.finalTranscript} ${this.interimTranscript}`.trim()
      this.callbacks.onEnd?.(transcript)
      this.recognition = null
    }

    this.recognition = recognition
    this.status = 'listening'

    try {
      recognition.start()
    } catch {
      this.status = 'error'
      this.callbacks.onError?.('unknown', 'Could not start speech recognition.')
    }
  }

  stop(): void {
    this.clearTimers()
    if (this.recognition !== null && this.status === 'listening') {
      this.status = 'stopped'
      this.recognition.stop()
    }
  }

  abort(): void {
    this.clearTimers()
    if (this.recognition !== null) {
      this.recognition.abort()
      this.recognition = null
    }
    if (this.status === 'listening') {
      this.status = 'idle'
    }
  }

  private startSilenceWatch(): void {
    this.clearSilenceTimer()
    this.silenceTimer = window.setInterval(() => {
      if (this.status !== 'listening' || !this.hadSpeech) {
        return
      }
      const silenceMs = this.options.silenceTimeoutMs ?? 1500
      if (Date.now() - this.lastSpeechAt >= silenceMs) {
        this.stop()
      }
    }, 200)
  }

  private startMaxDurationWatch(): void {
    this.clearMaxDurationTimer()
    const maxMs = this.options.maxDurationMs ?? 45000
    this.maxDurationTimer = window.setTimeout(() => {
      if (this.status === 'listening') {
        this.stop()
      }
    }, maxMs)
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) {
      window.clearInterval(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  private clearMaxDurationTimer(): void {
    if (this.maxDurationTimer !== null) {
      window.clearTimeout(this.maxDurationTimer)
      this.maxDurationTimer = null
    }
  }

  private clearTimers(): void {
    this.clearSilenceTimer()
    this.clearMaxDurationTimer()
  }
}
