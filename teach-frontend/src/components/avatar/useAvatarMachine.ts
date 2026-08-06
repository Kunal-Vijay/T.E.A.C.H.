import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AVATAR_HAPPY_PULSE_MS,
  mapMachineStateToOutput,
  type AvatarMachineInput,
  type AvatarMachineOutput,
  type AvatarMachineState,
} from './AvatarMachineState'
import {
  resolveTargetMachineState,
  transitionAvatarMachineState,
} from './avatarStateMachine'

/**
 * Drives InteractiveAvatar from application signals with smooth, interruptible transitions.
 * Inserts a brief happy state when streaming ends successfully.
 */
export function useAvatarMachine(input: AvatarMachineInput): AvatarMachineOutput {
  const [state, setState] = useState<AvatarMachineState>('idle')
  const happyTimerRef = useRef<number | null>(null)
  const prevStreamingRef = useRef(false)
  const inputRef = useRef(input)
  inputRef.current = input

  const clearHappyTimer = () => {
    if (happyTimerRef.current !== null) {
      window.clearTimeout(happyTimerRef.current)
      happyTimerRef.current = null
    }
  }

  useEffect(() => {
    const currentInput = inputRef.current
    const target = resolveTargetMachineState(currentInput)
    const wasStreaming = prevStreamingRef.current
    const isStreaming = currentInput.isStreaming === true

    if (wasStreaming && !isStreaming && !currentInput.hasError) {
      clearHappyTimer()
      setState((prev) => transitionAvatarMachineState(prev, 'happy', { force: true }))
      happyTimerRef.current = window.setTimeout(() => {
        happyTimerRef.current = null
        setState((prev) => {
          const settled = resolveTargetMachineState(inputRef.current)
          return transitionAvatarMachineState(prev, settled)
        })
      }, AVATAR_HAPPY_PULSE_MS)
      prevStreamingRef.current = isStreaming
      return
    }

    prevStreamingRef.current = isStreaming

    if (happyTimerRef.current !== null) {
      if (target === 'error' || target === 'celebrating' || target === 'talking') {
        clearHappyTimer()
        setState((prev) => transitionAvatarMachineState(prev, target, { force: true }))
      }
      return
    }

    setState((prev) => transitionAvatarMachineState(prev, target))
  }, [
    input.isStreaming,
    input.hasError,
    input.isCelebrating,
    input.isThinking,
    input.isListening,
    input.preferHappy,
  ])

  useEffect(() => () => clearHappyTimer(), [])

  return useMemo(() => mapMachineStateToOutput(state), [state])
}
