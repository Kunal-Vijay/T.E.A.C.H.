import { CURRENT_TUTOR_ID } from '../../lib/tutor/tutor.config'
import type { MentorProfile, TutorId } from '../../types/mentor.types'
import { isMentorId } from '../../lib/mentors'

const STORAGE_KEY = 'teach_student_profile'

/** Always returns Nova — the official AI Tutor. */
export function getMentorId(): TutorId {
  return CURRENT_TUTOR_ID
}

export function getMentorProfile(): MentorProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { mentorId: CURRENT_TUTOR_ID, selectedAt: Date.now() }
    }
    const parsed = JSON.parse(raw) as MentorProfile
    if (!isMentorId(parsed.mentorId)) {
      return { mentorId: CURRENT_TUTOR_ID, selectedAt: Date.now() }
    }
    return { ...parsed, mentorId: CURRENT_TUTOR_ID }
  } catch {
    return { mentorId: CURRENT_TUTOR_ID, selectedAt: Date.now() }
  }
}

/** @deprecated Tutor selection removed — always true. */
export function hasSelectedMentor(): boolean {
  return true
}

export function setStudentDisplayName(studentName: string): void {
  const profile: MentorProfile = {
    mentorId: CURRENT_TUTOR_ID,
    selectedAt: Date.now(),
    ...(studentName.trim() !== '' ? { studentName: studentName.trim() } : {}),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function clearMentorProfile(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getStudentDisplayName(): string | null {
  return getMentorProfile()?.studentName ?? null
}
