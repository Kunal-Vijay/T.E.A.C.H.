export const MOTIVATIONAL_KICKERS = [
  'You’re building real understanding.',
  'Small steps, lasting knowledge.',
  'Stay curious — it’s working.',
  'Focus beats cramming every time.',
  'Your future self will thank you.',
]

export const SLIDE_MILESTONES: Record<number, string> = {
  50: 'Halfway through this section — keep going.',
  100: 'Section complete. Ready for what’s next?',
}

export const QUIZ_CORRECT_LINES = [
  'Exactly right.',
  'Sharp thinking.',
  'You nailed it.',
  'That’s the idea.',
]

export const QUIZ_TRY_AGAIN_LINES = [
  'Not quite — but this is how learning sticks.',
  'Close. Let’s unpack it together.',
  'Every miss is data. Here’s the insight.',
]

export const LESSON_COMPLETE_LINES = [
  'Lesson moment complete.',
  'Another piece locked in.',
  'You moved the needle.',
]

export const TOPIC_COMPLETE_LINES = [
  'Topic mastered.',
  'That chapter is yours now.',
]

export const COURSE_COMPLETE_LINES = [
  'You finished the class.',
  'Full course — complete.',
]

export const SAGE_GREETING = 'I’m SAGE — think of me as your clarity co-pilot. No judgment, just help when you need it.'

export const SAGE_EMPTY_HINT = 'Stuck on something? Ask in your own words — I’ll meet you where you are.'

export const SAGE_PROMPTS = [
  'Can you explain that more simply?',
  'What’s the key idea here?',
  'Walk me through an example.',
]

export const SAGE_CLOSINGS = [
  'Nice work asking questions — that’s how it sticks.',
  'You’re thinking actively. Keep that energy.',
  'Curiosity looks good on you. Back to the lesson?',
  'Every question sharpens your understanding.',
]

export const SAGE_THINKING_LABEL = 'SAGE is thinking…'

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

export function dailyGoalLede(completed: number, goal: number, streak: number): string {
  if (completed >= goal) {
    return streak > 1
      ? `${streak}-day streak. Daily goal crushed — see you tomorrow.`
      : 'Daily goal done. Rest or explore another class.'
  }
  if (streak > 1) {
    return `${streak}-day streak. One lesson today keeps it alive.`
  }
  return 'Join a ready lesson — slides, voice, quizzes, and SAGE included.'
}
