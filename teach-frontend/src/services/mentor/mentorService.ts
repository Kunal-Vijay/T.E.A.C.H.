import { isMentorId } from '../../lib/mentors'
import type { MentorId, MentorProfile } from '../../types/mentor.types'

const STORAGE_KEY = 'teach_student_mentor'

export function getMentorProfile(): MentorProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    const parsed = JSON.parse(raw) as MentorProfile
    if (!isMentorId(parsed.mentorId)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function getMentorId(): MentorId | null {
  return getMentorProfile()?.mentorId ?? null
}

export function hasSelectedMentor(): boolean {
  return getMentorId() !== null
}

export function setMentorId(mentorId: MentorId, studentName?: string): void {
  const profile: MentorProfile = {
    mentorId,
    selectedAt: Date.now(),
    ...(studentName !== undefined && studentName.trim() !== '' ? { studentName: studentName.trim() } : {}),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function clearMentorProfile(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getStudentDisplayName(): string | null {
  return getMentorProfile()?.studentName ?? null
}
