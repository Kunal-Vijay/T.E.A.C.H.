import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createExpressionController,
  getDialogueForQuiz,
  getDialogueLine,
  getMentorById,
} from '../lib/mentors'
import {
  getMentorId,
  getMentorProfile,
  getStudentDisplayName,
  setMentorId as persistMentorId,
} from '../services/mentor/mentorService'
import type {
  DialogueKey,
  ExpressionState,
  MentorDefinition,
  MentorId,
  MentorProfile,
} from '../types/mentor.types'

interface MentorContextValue {
  mentor: MentorDefinition | null
  mentorId: MentorId | null
  expression: ExpressionState
  studentName: string | null
  hasMentor: boolean
  selectMentor: (id: MentorId, studentName?: string) => void
  setExpression: (state: ExpressionState) => void
  pulseExpression: (state: ExpressionState, durationMs?: number) => void
  getLine: (key: DialogueKey) => string
  reactToQuiz: (correct: boolean) => { line: string; expression: ExpressionState }
}

const MentorContext = createContext<MentorContextValue | null>(null)

export function MentorProvider({ children }: { children: ReactNode }) {
  const [mentorId, setMentorIdState] = useState<MentorId | null>(() => getMentorId())
  const [expression, setExpressionState] = useState<ExpressionState>('idle')
  const [studentName, setStudentName] = useState<string | null>(() => getStudentDisplayName())
  const controllerRef = useRef(createExpressionController(setExpressionState))

  const mentor = useMemo(
    () => (mentorId !== null ? getMentorById(mentorId) : null),
    [mentorId],
  )

  useEffect(() => {
    controllerRef.current = createExpressionController(setExpressionState, 'idle')
  }, [mentorId])

  const selectMentor = useCallback((id: MentorId, name?: string) => {
    persistMentorId(id, name)
    setMentorIdState(id)
    setStudentName(name?.trim() !== '' ? name?.trim() ?? null : getStudentDisplayName())
    controllerRef.current.pulse('excited', 1800)
  }, [])

  const setExpression = useCallback((state: ExpressionState) => {
    controllerRef.current.setState(state)
  }, [])

  const pulseExpression = useCallback((state: ExpressionState, durationMs = 2400) => {
    controllerRef.current.pulse(state, durationMs)
  }, [])

  const getLine = useCallback((key: DialogueKey) => {
    if (mentor === null) {
      return ''
    }
    return getDialogueLine(mentor, key)
  }, [mentor])

  const reactToQuiz = useCallback((correct: boolean) => {
    if (mentor === null) {
      return { line: '', expression: 'idle' as ExpressionState }
    }
    const line = getDialogueForQuiz(mentor, correct)
    const nextExpression: ExpressionState = correct
      ? mentor.expression.onCelebrate
      : mentor.expression.onEncourage
    controllerRef.current.pulse(nextExpression)
    return { line, expression: nextExpression }
  }, [mentor])

  const value = useMemo<MentorContextValue>(() => ({
    mentor,
    mentorId,
    expression,
    studentName,
    hasMentor: mentorId !== null,
    selectMentor,
    setExpression,
    pulseExpression,
    getLine,
    reactToQuiz,
  }), [
    mentor,
    mentorId,
    expression,
    studentName,
    selectMentor,
    setExpression,
    pulseExpression,
    getLine,
    reactToQuiz,
  ])

  return <MentorContext.Provider value={value}>{children}</MentorContext.Provider>
}

export function useMentor(): MentorContextValue {
  const ctx = useContext(MentorContext)
  if (ctx === null) {
    throw new Error('useMentor must be used within MentorProvider')
  }
  return ctx
}

export function useMentorOptional(): MentorContextValue | null {
  return useContext(MentorContext)
}

export function refreshMentorFromStorage(): MentorProfile | null {
  return getMentorProfile()
}
