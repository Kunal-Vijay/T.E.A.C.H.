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
} from '../lib/mentors'
import { getCurrentTutor, getTutorLabel } from '../lib/tutor'
import { getStudentDisplayName } from '../services/mentor/mentorService'
import type {
  DialogueKey,
  ExpressionState,
  MentorDefinition,
  TutorId,
} from '../types/mentor.types'

interface MentorContextValue {
  /** Current AI Tutor definition (Nova). */
  tutor: MentorDefinition
  /** @deprecated Use `tutor` */
  mentor: MentorDefinition
  tutorId: TutorId
  /** @deprecated Use `tutorId` */
  mentorId: TutorId
  expression: ExpressionState
  studentName: string | null
  tutorLabel: string
  setExpression: (state: ExpressionState) => void
  pulseExpression: (state: ExpressionState, durationMs?: number) => void
  getLine: (key: DialogueKey) => string
  reactToQuiz: (correct: boolean) => { line: string; expression: ExpressionState }
}

const MentorContext = createContext<MentorContextValue | null>(null)

export function MentorProvider({ children }: { children: ReactNode }) {
  const tutor = useMemo(() => getCurrentTutor(), [])
  const [expression, setExpressionState] = useState<ExpressionState>('idle')
  const [studentName] = useState<string | null>(() => getStudentDisplayName())
  const controllerRef = useRef(createExpressionController(setExpressionState))

  useEffect(() => {
    controllerRef.current = createExpressionController(setExpressionState, 'idle')
  }, [])

  const setExpression = useCallback((state: ExpressionState) => {
    controllerRef.current.setState(state)
  }, [])

  const pulseExpression = useCallback((state: ExpressionState, durationMs = 2400) => {
    controllerRef.current.pulse(state, durationMs)
  }, [])

  const getLine = useCallback((key: DialogueKey) => {
    return getDialogueLine(tutor, key)
  }, [tutor])

  const reactToQuiz = useCallback((correct: boolean) => {
    const line = getDialogueForQuiz(tutor, correct)
    const nextExpression: ExpressionState = correct
      ? tutor.expression.onCelebrate
      : tutor.expression.onEncourage
    controllerRef.current.pulse(nextExpression)
    return { line, expression: nextExpression }
  }, [tutor])

  const value = useMemo<MentorContextValue>(() => ({
    tutor,
    mentor: tutor,
    tutorId: tutor.id,
    mentorId: tutor.id,
    expression,
    studentName,
    tutorLabel: getTutorLabel(),
    setExpression,
    pulseExpression,
    getLine,
    reactToQuiz,
  }), [
    tutor,
    expression,
    studentName,
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

/** @deprecated Use useMentor — returns the current AI Tutor (Nova). */
export const useTutor = useMentor
