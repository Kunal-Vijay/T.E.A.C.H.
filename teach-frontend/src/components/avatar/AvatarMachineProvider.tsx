import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AvatarMachineInput, AvatarMachineOutput } from './AvatarMachineState'
import { useAvatarMachine } from './useAvatarMachine'

const AvatarMachineContext = createContext<AvatarMachineOutput | null>(null)

export interface AvatarMachineProviderProps {
  children: ReactNode
  /** Live application signals for the avatar state machine. */
  input: AvatarMachineInput
}

/**
 * Connects InteractiveAvatar to application state via a smooth state machine.
 * GIF avatars ignore this provider entirely.
 */
export function AvatarMachineProvider({ children, input }: AvatarMachineProviderProps) {
  const output = useAvatarMachine(input)

  const value = useMemo(() => output, [output.state, output.expression, output.isTalking])

  return (
    <AvatarMachineContext.Provider value={value}>
      {children}
    </AvatarMachineContext.Provider>
  )
}

export function useAvatarMachineOutput(): AvatarMachineOutput {
  const ctx = useContext(AvatarMachineContext)
  if (ctx === null) {
    throw new Error('useAvatarMachineOutput must be used within AvatarMachineProvider')
  }
  return ctx
}

export function useAvatarMachineOutputOptional(): AvatarMachineOutput | null {
  return useContext(AvatarMachineContext)
}
