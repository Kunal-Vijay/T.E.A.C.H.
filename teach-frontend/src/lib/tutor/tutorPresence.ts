export type TutorPresenceMode = 'speaking' | 'listening' | 'thinking' | 'ready' | 'standby'

export interface TutorPresence {
  mode: TutorPresenceMode
  label: string
}

/** Unified tutor status for classroom chrome — driven by app state, not expression. */
export function resolveTutorPresence(options: {
  showSpeaking: boolean
  isListening: boolean
  isThinking: boolean
  hasStarted: boolean
}): TutorPresence {
  if (options.showSpeaking) {
    return { mode: 'speaking', label: 'Speaking…' }
  }
  if (options.isThinking) {
    return { mode: 'thinking', label: 'Thinking…' }
  }
  if (options.isListening) {
    return { mode: 'listening', label: 'Listening…' }
  }
  if (!options.hasStarted) {
    return { mode: 'ready', label: 'Ready' }
  }
  return { mode: 'standby', label: 'Ready' }
}
