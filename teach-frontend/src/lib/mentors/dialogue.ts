import type { DialogueCategory, DialogueProfile, MentorDefinition, MentorId } from '../../types/mentor.types'

const RECENT_LIMIT = 3
const recentByMentor = new Map<MentorId, Map<DialogueCategory, string[]>>()

function getRecent(mentorId: MentorId, category: DialogueCategory): string[] {
  let mentorRecent = recentByMentor.get(mentorId)
  if (mentorRecent === undefined) {
    mentorRecent = new Map()
    recentByMentor.set(mentorId, mentorRecent)
  }
  return mentorRecent.get(category) ?? []
}

function markRecent(mentorId: MentorId, category: DialogueCategory, line: string): void {
  const mentorRecent = recentByMentor.get(mentorId) ?? new Map()
  const recent = mentorRecent.get(category) ?? []
  const next = [line, ...recent.filter((r: string) => r !== line)].slice(0, RECENT_LIMIT)
  mentorRecent.set(category, next)
  recentByMentor.set(mentorId, mentorRecent)
}

export function pickDialogue(mentor: MentorDefinition, category: DialogueCategory): string {
  const pool = mentor.dialogue[category]
  if (pool.length === 0) {
    return ''
  }
  if (pool.length === 1) {
    return pool[0] ?? ''
  }

  const recent = getRecent(mentor.id, category)
  const candidates = pool.filter((line) => !recent.includes(line))
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : pool[Math.floor(Math.random() * pool.length)]

  const line = chosen ?? pool[0] ?? ''
  markRecent(mentor.id, category, line)
  return line
}

/** Backward-compatible single-line accessor */
export function getDialogueLine(mentor: MentorDefinition, category: DialogueCategory): string {
  return pickDialogue(mentor, category)
}

export function getDialogueForQuiz(mentor: MentorDefinition, correct: boolean): string {
  return pickDialogue(mentor, correct ? 'quizCorrect' : 'quizWrong')
}

export function shouldPlayLessonIntro(mentor: MentorDefinition): boolean {
  if (!mentor.behavior.playLessonIntro) {
    return false
  }
  return Math.random() < mentor.behavior.lessonIntroChance
}

export function getLessonIntro(mentor: MentorDefinition): string {
  return pickDialogue(mentor, 'lessonIntros')
}

export type { DialogueProfile }
