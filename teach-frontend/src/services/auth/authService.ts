import { LEGACY_KEYS, SESSION_KEYS } from './sessionKeys'
import { clearMentorProfile } from '../mentor/mentorService'

export type AppRole = 'teacher' | 'student'

const ROLE_TTL_MS = 24 * 60 * 60 * 1000

interface StoredRole {
  role: AppRole
  issuedAt: number
}

function migrateLegacyRole(): AppRole | null {
  const legacy = sessionStorage.getItem(LEGACY_KEYS.role)
  if (legacy === 'admin') {
    setRole('teacher')
    sessionStorage.removeItem(LEGACY_KEYS.role)
    return 'teacher'
  }
  if (legacy === 'teacher' || legacy === 'student') {
    setRole(legacy)
    sessionStorage.removeItem(LEGACY_KEYS.role)
    return legacy
  }
  return null
}

export function getRole(): AppRole | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.role)
    if (raw === null) {
      return migrateLegacyRole()
    }
    const parsed = JSON.parse(raw) as StoredRole
    if (Date.now() - parsed.issuedAt > ROLE_TTL_MS) {
      clearAuth()
      return null
    }
    return parsed.role
  } catch {
    return migrateLegacyRole()
  }
}

export function setRole(role: AppRole): void {
  const payload: StoredRole = { role, issuedAt: Date.now() }
  sessionStorage.setItem(SESSION_KEYS.role, JSON.stringify(payload))
}

export function clearAuth(): void {
  sessionStorage.removeItem(SESSION_KEYS.role)
  sessionStorage.removeItem(SESSION_KEYS.studentId)
  sessionStorage.removeItem(SESSION_KEYS.studentOnboarded)
  sessionStorage.removeItem(LEGACY_KEYS.role)
  sessionStorage.removeItem(LEGACY_KEYS.classroomSessionId)
  sessionStorage.removeItem(LEGACY_KEYS.studentOnboarded)
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('teach_classroom_session_'))
    .forEach((key) => sessionStorage.removeItem(key))
  clearMentorProfile()
}

export function getStudentId(): string {
  const stored = sessionStorage.getItem(SESSION_KEYS.studentId)
  if (stored !== null && stored !== '') {
    return stored
  }
  const generated = `student_${crypto.randomUUID().slice(0, 8)}`
  sessionStorage.setItem(SESSION_KEYS.studentId, generated)
  return generated
}

export function getClassroomSessionId(generationId: string): string | null {
  const scoped = sessionStorage.getItem(SESSION_KEYS.classroomSession(generationId))
  if (scoped !== null && scoped !== '') {
    return scoped
  }
  const legacy = sessionStorage.getItem(LEGACY_KEYS.classroomSessionId)
  if (legacy !== null && legacy !== '') {
    sessionStorage.setItem(SESSION_KEYS.classroomSession(generationId), legacy)
    sessionStorage.removeItem(LEGACY_KEYS.classroomSessionId)
    return legacy
  }
  return null
}

export function setClassroomSessionId(generationId: string, sessionId: string): void {
  sessionStorage.setItem(SESSION_KEYS.classroomSession(generationId), sessionId)
}

export function clearClassroomSession(generationId: string): void {
  sessionStorage.removeItem(SESSION_KEYS.classroomSession(generationId))
}

export function isStudentOnboarded(): boolean {
  return (
    sessionStorage.getItem(SESSION_KEYS.studentOnboarded) === '1'
    || sessionStorage.getItem(LEGACY_KEYS.studentOnboarded) === '1'
  )
}

export function markStudentOnboarded(): void {
  sessionStorage.setItem(SESSION_KEYS.studentOnboarded, '1')
}
