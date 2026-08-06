import type { SpeechStatus } from '../../components/avatar/SpeechController'
import type { ExpressionState } from '../../types/mentor.types'

/** True when TTS narration is actively playing — drives NovaTutor GIF vs PNG. */
export function isNovaNarrating(speechStatus: SpeechStatus): boolean {
  return speechStatus === 'speaking'
}

/** Mentor chrome only (rings/confetti) — not for NovaTutor asset switching. */
export function resolveNovaSpeaking(
  expression: ExpressionState,
  isTalking = false,
): boolean {
  return isTalking || expression === 'speaking' || expression === 'explaining'
}
