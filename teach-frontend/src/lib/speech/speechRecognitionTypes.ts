/** Speech-to-text abstraction — swappable backend (browser, Deepgram, OpenAI Realtime, etc.) */

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'stopped' | 'error'

export type SpeechRecognitionErrorCode =
  | 'not-supported'
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'unknown'

export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void
  onResult?: (result: SpeechRecognitionResult) => void
  onEnd?: (finalTranscript: string) => void
  onError?: (code: SpeechRecognitionErrorCode, message: string) => void
}

export interface SpeechRecognitionOptions {
  language?: string
  /** Auto-stop after this many ms of silence once speech was detected (default 1500). */
  silenceTimeoutMs?: number
  /** Hard cap on listening duration (default 45000). */
  maxDurationMs?: number
  continuous?: boolean
  interimResults?: boolean
}

export interface SpeechRecognitionService {
  isSupported(): boolean
  getStatus(): SpeechRecognitionStatus
  start(options?: SpeechRecognitionOptions, callbacks?: SpeechRecognitionCallbacks): void
  stop(): void
  abort(): void
}
