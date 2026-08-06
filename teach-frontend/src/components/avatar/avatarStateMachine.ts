import type { SpeechStatus } from './SpeechController'
import type { AvatarMachineInput, AvatarMachineState } from './AvatarMachineState'
import { AVATAR_MACHINE_PRIORITY } from './AvatarMachineState'

export interface AvatarTransitionOptions {
  /** Bypass priority gate (e.g. post-speech smile). */
  force?: boolean
}

/**
 * Resolve the target machine state from live application signals.
 * Priority: error → celebrating → streaming → thinking → preferHappy → listening → idle
 */
export function resolveTargetMachineState(input: AvatarMachineInput): AvatarMachineState {
  if (input.hasError) {
    return 'error'
  }
  if (input.isCelebrating) {
    return 'celebrating'
  }
  if (input.isStreaming) {
    return 'talking'
  }
  if (input.isThinking) {
    return 'thinking'
  }
  if (input.preferHappy) {
    return 'happy'
  }
  if (input.isListening) {
    return 'listening'
  }
  return 'idle'
}

/**
 * Smooth state transitions — higher-priority states win; transient states may release naturally.
 */
export function transitionAvatarMachineState(
  current: AvatarMachineState,
  next: AvatarMachineState,
  options: AvatarTransitionOptions = {},
): AvatarMachineState {
  if (current === next) {
    return current
  }

  if (options.force || next === 'error') {
    return next
  }

  if (current === 'happy' || current === 'celebrating') {
    if (AVATAR_MACHINE_PRIORITY[next] <= AVATAR_MACHINE_PRIORITY[current]) {
      return next
    }
  }

  if (AVATAR_MACHINE_PRIORITY[next] >= AVATAR_MACHINE_PRIORITY[current]) {
    return next
  }

  if (current === 'talking' && (next === 'listening' || next === 'idle')) {
    return current
  }

  return current
}

export interface ClassroomAvatarInputParams {
  speechStatus: SpeechStatus
  isListening: boolean
  isThinking: boolean
  isCelebrating: boolean
  preferHappy?: boolean
}

export function buildClassroomAvatarInput(params: ClassroomAvatarInputParams): AvatarMachineInput {
  return {
    isStreaming: params.speechStatus === 'speaking',
    hasError: params.speechStatus === 'error',
    isListening: params.isListening,
    isThinking: params.isThinking,
    isCelebrating: params.isCelebrating,
    preferHappy: params.preferHappy,
  }
}

export interface VoiceDoubtAvatarInputParams {
  phase: 'listening' | 'review' | 'typing' | 'thinking' | 'answer'
  mode: 'voice' | 'type'
  recognitionPhase: string
  isSpeaking?: boolean
}

export function buildVoiceDoubtAvatarInput(params: VoiceDoubtAvatarInputParams): AvatarMachineInput {
  const isListening = params.mode === 'voice'
    && (params.phase === 'listening'
      || params.recognitionPhase === 'listening'
      || params.recognitionPhase === 'review')

  return {
    isStreaming: params.isSpeaking === true || params.phase === 'answer',
    isThinking: params.phase === 'thinking',
    isListening: isListening || params.phase === 'typing',
    preferHappy: params.phase === 'review',
  }
}
