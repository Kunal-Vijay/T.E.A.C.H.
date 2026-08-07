import { BrowserSpeechRecognitionService } from './BrowserSpeechRecognitionService'
import type { SpeechRecognitionService } from './speechRecognitionTypes'

/** Factory — swap implementation here for OpenAI Realtime, Deepgram, Azure, etc. */
export function createSpeechRecognitionService(): SpeechRecognitionService {
  return new BrowserSpeechRecognitionService()
}

export type {
  SpeechRecognitionCallbacks,
  SpeechRecognitionErrorCode,
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  SpeechRecognitionService,
  SpeechRecognitionStatus,
} from './speechRecognitionTypes'
