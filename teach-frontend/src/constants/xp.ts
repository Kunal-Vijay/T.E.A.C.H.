export const XP_REWARDS = {
  SLIDE: 5,
  PREDICTION: 15,
  QUIZ_CORRECT: 25,
  QUIZ_TRY: 10,
  SAGE_ASK: 10,
  STATE_COMPLETE: 40,
  TOPIC_COMPLETE: 75,
  COURSE_COMPLETE: 150,
} as const

export const DAILY_GOAL_LESSONS = 1

export interface AchievementDefinition {
  id: string
  title: string
  description: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_step', title: 'First steps', description: 'Completed your first lesson moment' },
  { id: 'quiz_spark', title: 'Quiz spark', description: 'Answered a pop quiz correctly' },
  { id: 'curious_mind', title: 'Curious mind', description: 'Asked SAGE your first question' },
  { id: 'streak_3', title: 'On a roll', description: '3-day learning streak' },
  { id: 'streak_7', title: 'Unstoppable', description: '7-day learning streak' },
  { id: 'course_graduate', title: 'Course graduate', description: 'Finished an entire class' },
]
