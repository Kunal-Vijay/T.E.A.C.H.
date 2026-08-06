import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MentorId } from '../../types/mentor.types'
import {
  DEFAULT_AVATAR_CHARACTER_ID,
  getAvatarConfig,
  resolveAvatarCharacterId,
  type AvatarCharacterId,
  type AvatarConfig,
} from './AvatarConfig'

function readInteractiveAvatarFlag(): boolean {
  return import.meta.env.VITE_USE_INTERACTIVE_AVATAR === 'true'
}

function readDefaultCharacterId(): AvatarCharacterId {
  const env = import.meta.env.VITE_DEFAULT_AVATAR_CHARACTER as string | undefined
  if (env === 'male-teacher' || env === 'female-teacher') {
    return env
  }
  return DEFAULT_AVATAR_CHARACTER_ID
}

interface AvatarContextValue {
  /** When true, Avatar renders InteractiveAvatar instead of the GIF. */
  useInteractiveAvatar: boolean
  /** Active interactive teacher character. */
  characterId: AvatarCharacterId
  config: AvatarConfig
  setCharacterId: (id: AvatarCharacterId) => void
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

const AvatarConfigOverrideContext = createContext<AvatarConfig | null>(null)

export interface AvatarProviderProps {
  children: ReactNode
  /** Optional override for tests — defaults to VITE_USE_INTERACTIVE_AVATAR. */
  forceInteractive?: boolean
  /** Initial interactive character — defaults to VITE_DEFAULT_AVATAR_CHARACTER or female. */
  initialCharacterId?: AvatarCharacterId
}

export function AvatarProvider({
  children,
  forceInteractive,
  initialCharacterId,
}: AvatarProviderProps) {
  const [characterId, setCharacterIdState] = useState<AvatarCharacterId>(
    initialCharacterId ?? readDefaultCharacterId(),
  )

  const setCharacterId = useCallback((id: AvatarCharacterId) => {
    setCharacterIdState(id)
  }, [])

  const config = useMemo(() => getAvatarConfig(characterId), [characterId])

  const value = useMemo<AvatarContextValue>(() => ({
    useInteractiveAvatar: forceInteractive ?? readInteractiveAvatarFlag(),
    characterId,
    config,
    setCharacterId,
  }), [forceInteractive, characterId, config, setCharacterId])

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  )
}

/**
 * Pin a single avatar instance to a character config without changing global selection.
 * Useful when rendering a mentor-specific interactive avatar beside a picker.
 */
export function AvatarConfigScope({
  characterId,
  children,
}: {
  characterId: AvatarCharacterId
  children: ReactNode
}) {
  const config = useMemo(() => getAvatarConfig(characterId), [characterId])
  return (
    <AvatarConfigOverrideContext.Provider value={config}>
      {children}
    </AvatarConfigOverrideContext.Provider>
  )
}

export function useAvatarMode(): Pick<AvatarContextValue, 'useInteractiveAvatar'> {
  const ctx = useContext(AvatarContext)
  if (ctx === null) {
    return { useInteractiveAvatar: readInteractiveAvatarFlag() }
  }
  return { useInteractiveAvatar: ctx.useInteractiveAvatar }
}

export function useAvatarCharacter(): Pick<
  AvatarContextValue,
  'characterId' | 'config' | 'setCharacterId'
> {
  const ctx = useContext(AvatarContext)
  if (ctx === null) {
    const fallbackId = readDefaultCharacterId()
    return {
      characterId: fallbackId,
      config: getAvatarConfig(fallbackId),
      setCharacterId: () => {},
    }
  }
  return {
    characterId: ctx.characterId,
    config: ctx.config,
    setCharacterId: ctx.setCharacterId,
  }
}

/** Resolved config: override scope → mentor mapping → global provider. */
export function useAvatarConfig(mentorId?: MentorId): AvatarConfig {
  const override = useContext(AvatarConfigOverrideContext)
  const { characterId, config } = useAvatarCharacter()

  return useMemo(() => {
    if (override !== null) {
      return override
    }
    if (mentorId !== undefined) {
      return getAvatarConfig(resolveAvatarCharacterId(mentorId, characterId))
    }
    return config
  }, [override, mentorId, characterId, config])
}

export { readInteractiveAvatarFlag, readDefaultCharacterId }
