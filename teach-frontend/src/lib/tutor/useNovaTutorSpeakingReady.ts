import { useEffect, useSyncExternalStore } from 'react'
import {
  NOVA_TUTOR_SPEAKING_SRC,
  isNovaTutorAssetReady,
  scheduleNovaTutorSpeakingPreload,
  subscribeNovaTutorAssetReady,
} from './novaTutorAssets'

/** True once the speaking GIF is cached — safe to bind img src without re-download. */
export function useNovaTutorSpeakingReady(): boolean {
  useEffect(() => {
    scheduleNovaTutorSpeakingPreload()
  }, [])

  return useSyncExternalStore(
    (onStoreChange) => subscribeNovaTutorAssetReady(NOVA_TUTOR_SPEAKING_SRC, onStoreChange),
    () => isNovaTutorAssetReady(NOVA_TUTOR_SPEAKING_SRC),
    () => false,
  )
}
