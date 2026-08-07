export const SESSION_KEYS = {
  role: 'teach_role',
  studentId: 'teach_student_id',
  studentOnboarded: 'teach_student_onboarded',
  classroomSession: (generationId: string) => `teach_classroom_session_${generationId}`,
} as const

/** Legacy keys migrated on read */
export const LEGACY_KEYS = {
  role: 'role',
  classroomSessionId: 'classroomSessionId',
  studentOnboarded: 'teach_student_onboarded',
} as const

export const MENTOR_STORAGE_KEY = 'teach_student_mentor'
