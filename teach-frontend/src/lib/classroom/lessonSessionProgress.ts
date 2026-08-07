import type { GoalStatus } from '../../types/learning.types'

interface LessonProgressInput {
  slideIndex: number
  slidesCount: number
  taughtTocItemCount: number
  tocItemCount: number
  goalStatus: GoalStatus
  sessionStatus: string
}

/**
 * Live lesson progress for the classroom header.
 * Slide advancement drives teach-mode progress; TOC coverage is merged via max()
 * so chat-driven TOC updates still register.
 */
export function computeLessonProgressPercent({
  slideIndex,
  slidesCount,
  taughtTocItemCount,
  tocItemCount,
  goalStatus,
  sessionStatus,
}: LessonProgressInput): number {
  if (goalStatus === 'completed' || sessionStatus === 'completed') {
    return 100
  }

  let slideProgress = 0
  if (slidesCount > 0) {
    slideProgress = Math.min(100, Math.round(((slideIndex + 1) / slidesCount) * 100))
  }

  let tocProgress = 0
  if (tocItemCount > 0) {
    tocProgress = Math.min(100, Math.round((taughtTocItemCount / tocItemCount) * 100))
  }

  if (slidesCount > 0) {
    return Math.max(slideProgress, tocProgress)
  }

  if (tocItemCount > 0) {
    return tocProgress
  }

  return 8
}
