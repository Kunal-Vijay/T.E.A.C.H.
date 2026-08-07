export {
  CURRENT_TUTOR,
  CURRENT_TUTOR_ID,
  TUTOR_ROLE,
  getCurrentTutor,
  getTutorAriaLabel,
  getTutorDisplayName,
  getTutorLabel,
  type CurrentTutorConfig,
} from './tutor.config'
export { resolveTutorPresence, type TutorPresence, type TutorPresenceMode } from './tutorPresence'
export { isNovaNarrating, resolveNovaSpeaking } from './novaSpeaking'
export { NOVA_SPEAKING_IDLE_DELAY_MS, useNovaSpeakingVisual } from './useNovaSpeakingVisual'
export {
  NOVA_TUTOR_IDLE_SRC,
  NOVA_TUTOR_SPEAKING_SRC,
  NOVA_TUTOR_INTRINSIC_WIDTH,
  NOVA_TUTOR_INTRINSIC_HEIGHT,
  preloadNovaTutorIdle,
  preloadNovaTutorSpeaking,
  scheduleNovaTutorSpeakingPreload,
  isNovaTutorAssetReady,
  subscribeNovaTutorAssetReady,
} from './novaTutorAssets'
export { useNovaTutorSpeakingReady } from './useNovaTutorSpeakingReady'
export { mentorVisualStyle } from './mentorVisualStyle'
export { resolveClassroomNovaContext, type ClassroomNovaContext } from './classroomNovaContext'
