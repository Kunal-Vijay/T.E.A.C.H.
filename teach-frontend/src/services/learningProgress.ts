import { DAILY_GOAL_LESSONS } from '../constants/xp'

const STORAGE_KEY = 'teach_learning_progress'

export interface SessionSummary {
  id: string
  completedAt: string
  xpEarned: number
  quizCorrect: number
  quizTotal: number
  sageQuestions: number
  statesCompleted: number
}

export interface LearningProgressData {
  xp: number
  streak: number
  lastActiveDate: string | null
  dailyGoal: number
  lessonsCompletedToday: number
  totalLessonsCompleted: number
  totalQuizzesCorrect: number
  achievements: string[]
  recentSessions: SessionSummary[]
}

export const DEFAULT_PROGRESS: LearningProgressData = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  dailyGoal: DAILY_GOAL_LESSONS,
  lessonsCompletedToday: 0,
  totalLessonsCompleted: 0,
  totalQuizzesCorrect: 0,
  achievements: [],
  recentSessions: [],
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function loadProgress(): LearningProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { ...DEFAULT_PROGRESS }
    }
    const parsed = JSON.parse(raw) as LearningProgressData
    return { ...DEFAULT_PROGRESS, ...parsed }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(data: LearningProgressData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function touchStreak(data: LearningProgressData): LearningProgressData {
  const today = todayKey()
  const yesterday = yesterdayKey()

  if (data.lastActiveDate === today) {
    return data
  }

  let streak = 1
  if (data.lastActiveDate === yesterday) {
    streak = data.streak + 1
  } else if (data.lastActiveDate !== null) {
    streak = 1
  }

  const lessonsCompletedToday = data.lastActiveDate === today ? data.lessonsCompletedToday : 0

  return {
    ...data,
    streak,
    lastActiveDate: today,
    lessonsCompletedToday,
  }
}

export function addXp(data: LearningProgressData, amount: number): LearningProgressData {
  return { ...data, xp: data.xp + amount }
}

export function unlockAchievement(data: LearningProgressData, achievementId: string): LearningProgressData {
  if (data.achievements.includes(achievementId)) {
    return data
  }
  return { ...data, achievements: [...data.achievements, achievementId] }
}

export function recordLessonComplete(data: LearningProgressData): LearningProgressData {
  const today = todayKey()
  const lessonsCompletedToday =
    data.lastActiveDate === today ? data.lessonsCompletedToday + 1 : 1

  return {
    ...data,
    lessonsCompletedToday,
    totalLessonsCompleted: data.totalLessonsCompleted + 1,
    lastActiveDate: today,
  }
}

export function recordQuizCorrect(data: LearningProgressData): LearningProgressData {
  return {
    ...data,
    totalQuizzesCorrect: data.totalQuizzesCorrect + 1,
  }
}

export function appendSessionSummary(
  data: LearningProgressData,
  summary: SessionSummary,
): LearningProgressData {
  const recentSessions = [summary, ...data.recentSessions].slice(0, 10)
  return { ...data, recentSessions }
}
