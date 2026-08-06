import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ACHIEVEMENTS, XP_REWARDS } from '../constants/xp'
import { featureFlags } from '../lib/featureFlags'
import {
  addXp,
  appendSessionSummary,
  DEFAULT_PROGRESS,
  loadProgress,
  recordLessonComplete,
  recordQuizCorrect,
  saveProgress,
  touchStreak,
  unlockAchievement,
  type LearningProgressData,
  type SessionSummary,
} from '../services/learningProgress'

export interface XpEvent {
  amount: number
  label: string
  celebrate?: boolean
}

export interface AchievementUnlock {
  id: string
  title: string
  description: string
}

interface LearningProgressContextValue {
  progress: LearningProgressData
  awardXp: (event: XpEvent) => AchievementUnlock | null
  completeLesson: () => AchievementUnlock | null
  completeTopic: () => AchievementUnlock | null
  completeCourse: (summary: Omit<SessionSummary, 'id' | 'completedAt'>) => AchievementUnlock | null
  recordQuizAnswer: (correct: boolean) => AchievementUnlock | null
  recordSageQuestion: () => AchievementUnlock | null
  recordSlideView: () => void
  recordPrediction: () => void
  startSession: () => void
}

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null)

const NOOP_LEARNING_PROGRESS: LearningProgressContextValue = {
  progress: DEFAULT_PROGRESS,
  awardXp: () => null,
  completeLesson: () => null,
  completeTopic: () => null,
  completeCourse: () => null,
  recordQuizAnswer: () => null,
  recordSageQuestion: () => null,
  recordSlideView: () => undefined,
  recordPrediction: () => undefined,
  startSession: () => undefined,
}

function findAchievement(id: string): AchievementUnlock | null {
  const def = ACHIEVEMENTS.find((item) => item.id === id)
  if (def === undefined) {
    return null
  }
  return def
}

function LearningProgressProviderActive({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LearningProgressData>(() => loadProgress())

  const persist = useCallback((updater: (current: LearningProgressData) => LearningProgressData) => {
    setProgress((current) => {
      const next = saveProgressAndReturn(updater(touchStreak(current)))
      return next
    })
  }, [])

  const saveProgressAndReturn = (data: LearningProgressData): LearningProgressData => {
    saveProgress(data)
    return data
  }

  const awardXp = useCallback((_event: XpEvent): AchievementUnlock | null => {
    return null
  }, [])

  const startSession = useCallback(() => {
    persist((current) => touchStreak(current))
  }, [persist])

  const recordSlideView = useCallback(() => {
    persist((current) => addXp(current, XP_REWARDS.SLIDE))
  }, [persist])

  const recordPrediction = useCallback(() => {
    persist((current) => addXp(current, XP_REWARDS.PREDICTION))
  }, [persist])

  const recordQuizAnswer = useCallback((correct: boolean): AchievementUnlock | null => {
    let unlock: AchievementUnlock | null = null
    persist((current) => {
      let next = addXp(current, correct ? XP_REWARDS.QUIZ_CORRECT : XP_REWARDS.QUIZ_TRY)
      if (correct) {
        next = recordQuizCorrect(next)
        if (!next.achievements.includes('quiz_spark')) {
          next = unlockAchievement(next, 'quiz_spark')
          unlock = findAchievement('quiz_spark')
        }
      }
      return next
    })
    return unlock
  }, [persist])

  const recordSageQuestion = useCallback((): AchievementUnlock | null => {
    let unlock: AchievementUnlock | null = null
    persist((current) => {
      let next = addXp(current, XP_REWARDS.SAGE_ASK)
      if (!next.achievements.includes('curious_mind')) {
        next = unlockAchievement(next, 'curious_mind')
        unlock = findAchievement('curious_mind')
      }
      return next
    })
    return unlock
  }, [persist])

  const completeLesson = useCallback((): AchievementUnlock | null => {
    let unlock: AchievementUnlock | null = null
    persist((current) => {
      let next = addXp(recordLessonComplete(current), XP_REWARDS.STATE_COMPLETE)
      if (!next.achievements.includes('first_step')) {
        next = unlockAchievement(next, 'first_step')
        unlock = findAchievement('first_step')
      }
      if (next.streak >= 3 && !next.achievements.includes('streak_3')) {
        next = unlockAchievement(next, 'streak_3')
        unlock = unlock ?? findAchievement('streak_3')
      }
      if (next.streak >= 7 && !next.achievements.includes('streak_7')) {
        next = unlockAchievement(next, 'streak_7')
        unlock = unlock ?? findAchievement('streak_7')
      }
      return next
    })
    return unlock
  }, [persist])

  const completeTopic = useCallback((): AchievementUnlock | null => {
    persist((current) => addXp(current, XP_REWARDS.TOPIC_COMPLETE))
    return null
  }, [persist])

  const completeCourse = useCallback((
    summary: Omit<SessionSummary, 'id' | 'completedAt'>,
  ): AchievementUnlock | null => {
    let unlock: AchievementUnlock | null = null
    persist((current) => {
      let next = addXp(recordLessonComplete(current), XP_REWARDS.COURSE_COMPLETE)
      if (!next.achievements.includes('course_graduate')) {
        next = unlockAchievement(next, 'course_graduate')
        unlock = findAchievement('course_graduate')
      }
      next = appendSessionSummary(next, {
        ...summary,
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
      })
      return next
    })
    return unlock
  }, [persist])

  const value = useMemo(
    () => ({
      progress,
      awardXp,
      completeLesson,
      completeTopic,
      completeCourse,
      recordQuizAnswer,
      recordSageQuestion,
      recordSlideView,
      recordPrediction,
      startSession,
    }),
    [
      progress,
      awardXp,
      completeLesson,
      completeTopic,
      completeCourse,
      recordQuizAnswer,
      recordSageQuestion,
      recordSlideView,
      recordPrediction,
      startSession,
    ],
  )

  return (
    <LearningProgressContext.Provider value={value}>
      {children}
    </LearningProgressContext.Provider>
  )
}

export function LearningProgressProvider({ children }: { children: ReactNode }) {
  if (!featureFlags.delightGamification) {
    return (
      <LearningProgressContext.Provider value={NOOP_LEARNING_PROGRESS}>
        {children}
      </LearningProgressContext.Provider>
    )
  }
  return <LearningProgressProviderActive>{children}</LearningProgressProviderActive>
}

export function useLearningProgress() {
  const context = useContext(LearningProgressContext)
  if (context === null) {
    throw new Error('useLearningProgress must be used within LearningProgressProvider')
  }
  return context
}
