import { useEffect, useState } from 'react'

/** Delay before returning to idle PNG after narration stops — avoids GIF flicker between segments. */
export const NOVA_SPEAKING_IDLE_DELAY_MS = 320

/**
 * Asymmetric speaking visual: GIF on immediately, PNG after a short pause when narration ends.
 * Pass the app's live narration flag (e.g. speechStatus === 'speaking').
 */
export function useNovaSpeakingVisual(
  speaking: boolean,
  idleDelayMs = NOVA_SPEAKING_IDLE_DELAY_MS,
): boolean {
  const [visualSpeaking, setVisualSpeaking] = useState(speaking)

  useEffect(() => {
    if (speaking) {
      setVisualSpeaking(true)
      return
    }

    const timer = window.setTimeout(() => {
      setVisualSpeaking(false)
    }, idleDelayMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [speaking, idleDelayMs])

  return visualSpeaking
}
